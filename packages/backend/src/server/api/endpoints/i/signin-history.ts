import define from '../../define';
import { Signins } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = makePaginationQuery(Signins.createQueryBuilder('signin'), ps.sinceId, ps.untilId)
		.andWhere(`signin.userId = :meId`, { meId: user.id });

	const history = await query.take(ps.limit).getMany();

	return await Promise.all(history.map(record => Signins.pack(record)));
});
