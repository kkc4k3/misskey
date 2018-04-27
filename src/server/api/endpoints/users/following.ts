/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import User from '../../../../models/user';
import Following from '../../../../models/following';
import { pack } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';

/**
 * Get following users of a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).type(ID).get();
	if (userIdErr) return rej('invalid userId param');

	// Get 'iknow' parameter
	const [iknow = false, iknowErr] = $(params.iknow).optional.boolean().get();
	if (iknowErr) return rej('invalid iknow param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'cursor' parameter
	const [cursor = null, cursorErr] = $(params.cursor).optional.type(ID).get();
	if (cursorErr) return rej('invalid cursor param');

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

	// Construct query
	const query = {
		followerId: user._id
	} as any;

	// ログインしていてかつ iknow フラグがあるとき
	if (me && iknow) {
		// Get my friends
		const myFriends = await getFriendIds(me._id);

		query.followeeId = {
			$in: myFriends
		};
	}

	// カーソルが指定されている場合
	if (cursor) {
		query._id = {
			$lt: cursor
		};
	}

	// Get followers
	const following = await Following
		.find(query, {
			limit: limit + 1,
			sort: { _id: -1 }
		});

	// 「次のページ」があるかどうか
	const inStock = following.length === limit + 1;
	if (inStock) {
		following.pop();
	}

	// Serialize
	const users = await Promise.all(following.map(async f =>
		await pack(f.followeeId, me, { detail: true })));

	// Response
	res({
		users: users,
		next: inStock ? following[following.length - 1]._id : null,
	});
});
