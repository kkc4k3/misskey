import define from '../../define';
import { ApiError } from '../../error';
import { Pages, Users } from '@/models/index';
import { Page } from '@/models/entities/page';

export const meta = {
	tags: ['pages'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Page',
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '222120c0-3ead-4528-811b-b96f233388d7',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string' },
		username: { type: 'string' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let page: Page | undefined;

	if (ps.pageId) {
		page = await Pages.findOne(ps.pageId);
	} else if (ps.name && ps.username) {
		const author = await Users.findOne({
			host: null,
			usernameLower: ps.username.toLowerCase(),
		});
		if (author) {
			page = await Pages.findOne({
				name: ps.name,
				userId: author.id,
			});
		}
	}

	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	return await Pages.pack(page, user);
});
