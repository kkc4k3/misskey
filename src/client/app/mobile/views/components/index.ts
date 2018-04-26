import Vue from 'vue';

import ui from './ui.vue';
import note from './note.vue';
import notes from './notes.vue';
import mediaImage from './media-image.vue';
import mediaVideo from './media-video.vue';
import drive from './drive.vue';
import notePreview from './note-preview.vue';
import subNoteContent from './sub-note-content.vue';
import noteCard from './note-card.vue';
import userCard from './user-card.vue';
import noteDetail from './note-detail.vue';
import followButton from './follow-button.vue';
import friendsMaker from './friends-maker.vue';
import notification from './notification.vue';
import notifications from './notifications.vue';
import notificationPreview from './notification-preview.vue';
import usersList from './users-list.vue';
import userPreview from './user-preview.vue';
import userTimeline from './user-timeline.vue';
import userListTimeline from './user-list-timeline.vue';
import activity from './activity.vue';
import widgetContainer from './widget-container.vue';

Vue.component('mk-ui', ui);
Vue.component('mk-note', note);
Vue.component('mk-notes', notes);
Vue.component('mk-media-image', mediaImage);
Vue.component('mk-media-video', mediaVideo);
Vue.component('mk-drive', drive);
Vue.component('mk-note-preview', notePreview);
Vue.component('mk-sub-note-content', subNoteContent);
Vue.component('mk-note-card', noteCard);
Vue.component('mk-user-card', userCard);
Vue.component('mk-note-detail', noteDetail);
Vue.component('mk-follow-button', followButton);
Vue.component('mk-friends-maker', friendsMaker);
Vue.component('mk-notification', notification);
Vue.component('mk-notifications', notifications);
Vue.component('mk-notification-preview', notificationPreview);
Vue.component('mk-users-list', usersList);
Vue.component('mk-user-preview', userPreview);
Vue.component('mk-user-timeline', userTimeline);
Vue.component('mk-user-list-timeline', userListTimeline);
Vue.component('mk-activity', activity);
Vue.component('mk-widget-container', widgetContainer);
