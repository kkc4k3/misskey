<mk-messaging-room-page>
	<mk-messaging-room if={ user } user={ user } isNaked={ true }/>

	<style>
		:scope
			display block
			position fixed
			width 100%
			height 100%
			background #fff

	</style>
	<script>
		import Progress from '../../../common/scripts/loading';

		this.mixin('api');

		this.fetching = true;
		this.user = null;

		this.on('mount', () => {
			Progress.start();

			this.api('users/show', {
				username: this.opts.user
			}).then(user => {
				this.update({
					fetching: false,
					user: user
				});

				document.title = 'メッセージ: ' + this.user.name;

				Progress.done();
			});
		});
	</script>
</mk-messaging-room-page>
