/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import Reaction from '../../../../../models/note-reaction';
import Note from '../../../../../models/note';

/**
 * Unreact to a note
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).type(ID).$;
	if (noteIdErr) return rej('invalid noteId param');

	// Fetch unreactee
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	// if already unreacted
	const exist = await Reaction.findOne({
		noteId: note._id,
		userId: user._id,
		deletedAt: { $exists: false }
	});

	if (exist === null) {
		return rej('never reacted');
	}

	// Delete reaction
	await Reaction.update({
		_id: exist._id
	}, {
			$set: {
				deletedAt: new Date()
			}
		});

	// Send response
	res();

	const dec = {};
	dec[`reactionCounts.${exist.reaction}`] = -1;

	// Decrement reactions count
	Note.update({ _id: note._id }, {
		$inc: dec
	});
});
