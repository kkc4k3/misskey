<template>
	<div class="hpaizdrt" :style="bg">
		<img v-if="instance.faviconUrl" class="icon" :src="instance.faviconUrl" />
		<span class="name">{{ instance.name }}</span>
	</div>
</template>

<script lang="ts" setup>
import {} from "vue";
import { instanceName } from "@/config";
import { instance as Instance } from "@/instance";

const props = defineProps<{
	instance?: {
		faviconUrl?: string;
		name: string;
		themeColor?: string;
	};
}>();

// if no instance data is given, this is for the local instance
const instance = props.instance ?? {
	faviconUrl: Instance.iconUrl || Instance.faviconUrl || "/favicon.ico",
	name: instanceName,
	themeColor: (
		document.querySelector('meta[name="theme-color-orig"]') as HTMLMetaElement
	)?.content,
};

const themeColor = instance.themeColor ?? "#777777";

const bg = {
	background: `linear-gradient(90deg, ${themeColor}, ${themeColor}00)`,
};
</script>

<style lang="scss" scoped>
.hpaizdrt {
	$height: 1.4rem;
	height: $height;
	border-radius: 4px 0 0 4px;
	overflow: hidden;
	color: #fff;
	display: flex;
	align-items: center;

	> .icon {
		height: 1.1rem;
		width: 1.1rem;
		border-radius: 0.2rem;
		margin-left: 0.2rem;
		object-fit: contain;
	}

	> .name {
		margin-left: 4px;
		line-height: $height;
		font-size: 0.9em;
		vertical-align: top;
		font-weight: 600;
	}
}
</style>
