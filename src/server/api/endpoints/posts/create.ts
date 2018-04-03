/**
 * Module dependencies
 */
import $ from 'cafy';
import deepEqual = require('deep-equal');
import renderAcct from '../../../../acct/render';
import config from '../../../../config';
import html from '../../../../text/html';
import parse from '../../../../text/parse';
import Post, { IPost, isValidText, isValidCw } from '../../../../models/post';
import { ILocalUser } from '../../../../models/user';
import Channel, { IChannel } from '../../../../models/channel';
import DriveFile from '../../../../models/drive-file';
import create from '../../../../post/create';
import distribute from '../../../../post/distribute';

/**
 * Create a post
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = (params, user: ILocalUser, app) => new Promise(async (res, rej) => {
	// Get 'visibility' parameter
	const [visibility = 'public', visibilityErr] = $(params.visibility).optional.string().or(['public', 'unlisted', 'private', 'direct']).$;
	if (visibilityErr) return rej('invalid visibility');

	// Get 'text' parameter
	const [text, textErr] = $(params.text).optional.string().pipe(isValidText).$;
	if (textErr) return rej('invalid text');

	// Get 'cw' parameter
	const [cw, cwErr] = $(params.cw).optional.string().pipe(isValidCw).$;
	if (cwErr) return rej('invalid cw');

	// Get 'viaMobile' parameter
	const [viaMobile = false, viaMobileErr] = $(params.viaMobile).optional.boolean().$;
	if (viaMobileErr) return rej('invalid viaMobile');

	// Get 'tags' parameter
	const [tags = [], tagsErr] = $(params.tags).optional.array('string').unique().eachQ(t => t.range(1, 32)).$;
	if (tagsErr) return rej('invalid tags');

	// Get 'geo' parameter
	const [geo, geoErr] = $(params.geo).optional.nullable.strict.object()
		.have('coordinates', $().array().length(2)
			.item(0, $().number().range(-180, 180))
			.item(1, $().number().range(-90, 90)))
		.have('altitude', $().nullable.number())
		.have('accuracy', $().nullable.number())
		.have('altitudeAccuracy', $().nullable.number())
		.have('heading', $().nullable.number().range(0, 360))
		.have('speed', $().nullable.number())
		.$;
	if (geoErr) return rej('invalid geo');

	// Get 'mediaIds' parameter
	const [mediaIds, mediaIdsErr] = $(params.mediaIds).optional.array('id').unique().range(1, 4).$;
	if (mediaIdsErr) return rej('invalid mediaIds');

	let files = [];
	if (mediaIds !== undefined) {
		// Fetch files
		// forEach だと途中でエラーなどがあっても return できないので
		// 敢えて for を使っています。
		for (const mediaId of mediaIds) {
			// Fetch file
			// SELECT _id
			const entity = await DriveFile.findOne({
				_id: mediaId,
				'metadata.userId': user._id
			});

			if (entity === null) {
				return rej('file not found');
			} else {
				files.push(entity);
			}
		}
	} else {
		files = null;
	}

	// Get 'repostId' parameter
	const [repostId, repostIdErr] = $(params.repostId).optional.id().$;
	if (repostIdErr) return rej('invalid repostId');

	let repost: IPost = null;
	let isQuote = false;
	if (repostId !== undefined) {
		// Fetch repost to post
		repost = await Post.findOne({
			_id: repostId
		});

		if (repost == null) {
			return rej('repostee is not found');
		} else if (repost.repostId && !repost.text && !repost.mediaIds) {
			return rej('cannot repost to repost');
		}

		// Fetch recently post
		const latestPost = await Post.findOne({
			userId: user._id
		}, {
			sort: {
				_id: -1
			}
		});

		isQuote = text != null || files != null;

		// 直近と同じRepost対象かつ引用じゃなかったらエラー
		if (latestPost &&
			latestPost.repostId &&
			latestPost.repostId.equals(repost._id) &&
			!isQuote) {
			return rej('cannot repost same post that already reposted in your latest post');
		}

		// 直近がRepost対象かつ引用じゃなかったらエラー
		if (latestPost &&
			latestPost._id.equals(repost._id) &&
			!isQuote) {
			return rej('cannot repost your latest post');
		}
	}

	// Get 'replyId' parameter
	const [replyId, replyIdErr] = $(params.replyId).optional.id().$;
	if (replyIdErr) return rej('invalid replyId');

	let reply: IPost = null;
	if (replyId !== undefined) {
		// Fetch reply
		reply = await Post.findOne({
			_id: replyId
		});

		if (reply === null) {
			return rej('in reply to post is not found');
		}

		// 返信対象が引用でないRepostだったらエラー
		if (reply.repostId && !reply.text && !reply.mediaIds) {
			return rej('cannot reply to repost');
		}
	}

	// Get 'channelId' parameter
	const [channelId, channelIdErr] = $(params.channelId).optional.id().$;
	if (channelIdErr) return rej('invalid channelId');

	let channel: IChannel = null;
	if (channelId !== undefined) {
		// Fetch channel
		channel = await Channel.findOne({
			_id: channelId
		});

		if (channel === null) {
			return rej('channel not found');
		}

		// 返信対象の投稿がこのチャンネルじゃなかったらダメ
		if (reply && !channelId.equals(reply.channelId)) {
			return rej('チャンネル内部からチャンネル外部の投稿に返信することはできません');
		}

		// Repost対象の投稿がこのチャンネルじゃなかったらダメ
		if (repost && !channelId.equals(repost.channelId)) {
			return rej('チャンネル内部からチャンネル外部の投稿をRepostすることはできません');
		}

		// 引用ではないRepostはダメ
		if (repost && !isQuote) {
			return rej('チャンネル内部では引用ではないRepostをすることはできません');
		}
	} else {
		// 返信対象の投稿がチャンネルへの投稿だったらダメ
		if (reply && reply.channelId != null) {
			return rej('チャンネル外部からチャンネル内部の投稿に返信することはできません');
		}

		// Repost対象の投稿がチャンネルへの投稿だったらダメ
		if (repost && repost.channelId != null) {
			return rej('チャンネル外部からチャンネル内部の投稿をRepostすることはできません');
		}
	}

	// Get 'poll' parameter
	const [poll, pollErr] = $(params.poll).optional.strict.object()
		.have('choices', $().array('string')
			.unique()
			.range(2, 10)
			.each(c => c.length > 0 && c.length < 50))
		.$;
	if (pollErr) return rej('invalid poll');

	if (poll) {
		(poll as any).choices = (poll as any).choices.map((choice, i) => ({
			id: i, // IDを付与
			text: choice.trim(),
			votes: 0
		}));
	}

	// テキストが無いかつ添付ファイルが無いかつRepostも無いかつ投票も無かったらエラー
	if (text === undefined && files === null && repost === null && poll === undefined) {
		return rej('text, mediaIds, repostId or poll is required');
	}

	// 直近の投稿と重複してたらエラー
	// TODO: 直近の投稿が一日前くらいなら重複とは見なさない
	if (user.latestPost) {
		if (deepEqual({
			text: user.latestPost.text,
			reply: user.latestPost.replyId ? user.latestPost.replyId.toString() : null,
			repost: user.latestPost.repostId ? user.latestPost.repostId.toString() : null,
			mediaIds: (user.latestPost.mediaIds || []).map(id => id.toString())
		}, {
			text: text,
			reply: reply ? reply._id.toString() : null,
			repost: repost ? repost._id.toString() : null,
			mediaIds: (files || []).map(file => file._id.toString())
		})) {
			return rej('duplicate');
		}
	}

	let tokens = null;
	if (text) {
		// Analyze
		tokens = parse(text);

		// Extract hashtags
		const hashtags = tokens
			.filter(t => t.type == 'hashtag')
			.map(t => t.hashtag);

		hashtags.forEach(tag => {
			if (tags.indexOf(tag) == -1) {
				tags.push(tag);
			}
		});
	}

	let atMentions = [];

	// If has text content
	if (text) {
		/*
				// Extract a hashtags
				const hashtags = tokens
					.filter(t => t.type == 'hashtag')
					.map(t => t.hashtag)
					// Drop dupulicates
					.filter((v, i, s) => s.indexOf(v) == i);

				// ハッシュタグをデータベースに登録
				registerHashtags(user, hashtags);
		*/
		// Extract an '@' mentions
		atMentions = tokens
			.filter(t => t.type == 'mention')
			.map(renderAcct)
			// Drop dupulicates
			.filter((v, i, s) => s.indexOf(v) == i);
	}

	// 投稿を作成
	const post = await create({
		createdAt: new Date(),
		channelId: channel ? channel._id : undefined,
		index: channel ? channel.index + 1 : undefined,
		mediaIds: files ? files.map(file => file._id) : [],
		poll: poll,
		text: text,
		textHtml: tokens === null ? null : html(tokens),
		cw: cw,
		tags: tags,
		userId: user._id,
		appId: app ? app._id : null,
		viaMobile: viaMobile,
		visibility,
		geo
	}, reply, repost, atMentions);

	const postObj = await distribute(user, post.mentions, post);

	// Reponse
	res({
		createdPost: postObj
	});

	// Register to search database
	if (post.text && config.elasticsearch.enable) {
		const es = require('../../../db/elasticsearch');

		es.index({
			index: 'misskey',
			type: 'post',
			id: post._id.toString(),
			body: {
				text: post.text
			}
		});
	}
});
