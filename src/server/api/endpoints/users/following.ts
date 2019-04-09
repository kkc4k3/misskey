import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Users, Followings } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { toPuny } from '../../../../misc/convert-host';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのフォロー一覧を取得します。',
		'en-US': 'Get following users of a user.'
	},

	tags: ['users'],

	requireCredential: false,

	params: {
		userId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		username: {
			validator: $.optional.str
		},

		host: {
			validator: $.optional.nullable.str
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Following',
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '63e4aba4-4156-4e53-be25-c9559e42d71b'
		}
	}
};

export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId != null
		? { id: ps.userId }
		: { usernameLower: ps.username.toLowerCase(), host: toPuny(ps.host) });

	if (user == null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	const query = makePaginationQuery(Followings.createQueryBuilder('following'), ps.sinceId, ps.untilId)
		.andWhere(`following.followerId = :userId`, { userId: user.id });

	const followings = await query
		.take(ps.limit)
		.getMany();

	return await Followings.packMany(followings, me, { populateFollowee: true });
});
