/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../../../../models/user';
import Post from '../../../../../models/post';

/**
 * Aggregate post of a user
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).id().$;
	if (userIdErr) return rej('invalid userId param');

	// Lookup user
	const user = await User.findOne({
		_id: userId
	}, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	const datas = await Post
		.aggregate([
			{ $match: { userId: user._id } },
			{ $project: {
				repostId: '$repostId',
				replyId: '$replyId',
				createdAt: { $add: ['$createdAt', 9 * 60 * 60 * 1000] } // Convert into JST
			}},
			{ $project: {
				date: {
					year: { $year: '$createdAt' },
					month: { $month: '$createdAt' },
					day: { $dayOfMonth: '$createdAt' }
				},
				type: {
					$cond: {
						if: { $ne: ['$repostId', null] },
						then: 'repost',
						else: {
							$cond: {
								if: { $ne: ['$replyId', null] },
								then: 'reply',
								else: 'post'
							}
						}
					}
				}}
			},
			{ $group: { _id: {
				date: '$date',
				type: '$type'
			}, count: { $sum: 1 } } },
			{ $group: {
				_id: '$_id.date',
				data: { $addToSet: {
					type: '$_id.type',
					count: '$count'
				}}
			} }
		]);

	datas.forEach(data => {
		data.date = data._id;
		delete data._id;

		data.posts = (data.data.filter(x => x.type == 'post')[0] || { count: 0 }).count;
		data.reposts = (data.data.filter(x => x.type == 'repost')[0] || { count: 0 }).count;
		data.replies = (data.data.filter(x => x.type == 'reply')[0] || { count: 0 }).count;

		delete data.data;
	});

	const graph = [];

	for (let i = 0; i < 30; i++) {
		const day = new Date(new Date().setDate(new Date().getDate() - i));

		const data = datas.filter(d =>
			d.date.year == day.getFullYear() && d.date.month == day.getMonth() + 1 && d.date.day == day.getDate()
		)[0];

		if (data) {
			graph.push(data);
		} else {
			graph.push({
				date: {
					year: day.getFullYear(),
					month: day.getMonth() + 1, // In JavaScript, month is zero-based.
					day: day.getDate()
				},
				posts: 0,
				reposts: 0,
				replies: 0
			});
		}
	}

	res(graph);
});
