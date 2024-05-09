// noinspection JSUnusedGlobalSymbols

import { CanvasRenderingContext2D, createCanvas, ImageData, loadImage } from 'canvas';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { decompressFrames, parseGIF } from 'gifuct-js';
import GIFEncoder from 'gif-encoder';
import { getUploadLimitForChannel } from '../../utils/utils';
import { Command } from '../../types/interaction';

const SpeechBubble: Command = {
	data: new SlashCommandBuilder()
		.setName('speechbubble')
		.setDescription('Add a transparent speech bubble to the given image.')
		.addAttachmentOption(option => option
			.setName('image')
			.setDescription('The image to add a speech bubble to')
			.setRequired(true))
		.addNumberOption(option => option
			.setName('x')
			.setDescription('The X position of the tip of the speech bubble, from 0-1 (with (0,0) as the top left of the image)')
			.setMinValue(0)
			.setMaxValue(1))
		.addNumberOption(option => option
			.setName('y')
			.setDescription('The Y position of the tip of the speech bubble, from 0-1 (with (0,0) as the top left of the image)')
			.setMinValue(0)
			.setMaxValue(1))
		.addBooleanOption(option => option
			.setName('ephemeral')
			.setDescription('Make the response invisible to everyone but you (default: false)')),

	async execute(interaction: ChatInputCommandInteraction) {
		const image = interaction.options.getAttachment('image', true);
		if (!image.contentType || !image.contentType.startsWith('image')) {
			return interaction.reply({ content: 'File attached does not appear to be an image!', ephemeral: true });
		}

		const imageResponse = await fetch(image.url);
		if (!imageResponse.body) {
			return interaction.reply({ content: 'Unable to download attachment.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('ephemeral') ?? false });

		let imageName = 'image';
		if (image.name) {
			imageName = image.name.slice(0, image.name.lastIndexOf('.'));
		}

		const imageBuf = Buffer.from(await imageResponse.arrayBuffer());

		const tipX = interaction.options.getNumber('x');
		const tipY = interaction.options.getNumber('y');

		const drawSpeechBubble = (ctx: CanvasRenderingContext2D, width: number, height: number, fillColor?: string) => {
			ctx.save();
			ctx.beginPath();
			const semiMajor = width / 1.9;
			const semiMajorSquared = Math.pow(semiMajor, 2);
			const semiMinor = height / 6;
			const semiMinorSquared = Math.pow(semiMinor, 2);
			ctx.ellipse(width / 2, 0, semiMajor, semiMinor, 0, 0, 2 * Math.PI);
			ctx.moveTo(width / 2, semiMinor);
			ctx.lineTo(tipX ? tipX * width : semiMajor, tipY ? tipY * height : height / 3);
			// i'm a genius
			const endPointX = width / 2.5;
			const endPointY = Math.sqrt(semiMinorSquared - ((Math.pow(endPointX, 2) * semiMinorSquared) / semiMajorSquared));
			ctx.lineTo(endPointX, endPointY);
			ctx.clip();
			if (fillColor) {
				ctx.fillStyle = fillColor;
				ctx.fillRect(0, 0, width, height);
			} else {
				ctx.clearRect(0, 0, width, height);
			}
			ctx.restore();
		};

		let attachment: AttachmentBuilder;
		const gif = image.contentType.endsWith('gif');
		if (!gif) {
			const drawableImage = await loadImage(imageBuf);
			const canvas = createCanvas(drawableImage.width, drawableImage.height);
			const ctx = canvas.getContext('2d');

			ctx.drawImage(drawableImage, 0, 0);
			drawSpeechBubble(ctx, canvas.width, canvas.height);

			attachment = new AttachmentBuilder(canvas.createPNGStream())
				.setName(`${imageName}_speech_bubble.png`);
		} else {
			const gif = parseGIF(imageBuf);
			const frames = decompressFrames(gif, true);

			const tempCanvas = createCanvas(frames[0].dims.width, frames[0].dims.height);
			const tempCtx = tempCanvas.getContext('2d');
			const gifCanvas = createCanvas(tempCanvas.width, tempCanvas.height);
			const gifCtx = gifCanvas.getContext('2d');

			const encoder = new GIFEncoder(gifCanvas.width, gifCanvas.height);
			encoder.setDispose(1);
			encoder.setRepeat(0);
			encoder.writeHeader();

			const outputBufChunks: Buffer[] = [];
			encoder.on('data', chunk => {
				outputBufChunks.push(chunk);
			});

			let frameImageData: ImageData | undefined = undefined;
			for (const frame of frames) {
				if (!frameImageData || frame.dims.width != frameImageData.width || frame.dims.height != frameImageData.height) {
					tempCanvas.width = frame.dims.width;
					tempCanvas.height = frame.dims.height;
					frameImageData = tempCtx.createImageData(frame.dims.width, frame.dims.height);
				}
				frameImageData.data.set(frame.patch);
				tempCtx.putImageData(frameImageData, 0, 0);
				gifCtx.drawImage(tempCanvas, frame.dims.left, frame.dims.top);
				drawSpeechBubble(gifCtx, frame.dims.width, frame.dims.height, '#313338');

				encoder.setDelay(frame.delay);
				encoder.addFrame(gifCtx.getImageData(0, 0, gifCanvas.width, gifCanvas.height).data);
			}
			encoder.finish();
			const outputBuf = Buffer.concat(outputBufChunks);

			if ((getUploadLimitForChannel(interaction.channel) * 1024 * 1024) <= outputBuf.length) {
				return interaction.editReply(`Sorry, the processed GIF is too big to upload! It weighs in at ${(outputBuf.length / 1024 / 1024).toFixed(2)}mb.`);
			}

			attachment = new AttachmentBuilder(outputBuf)
				.setName(`${imageName}_speech_bubble.gif`);
		}
		return interaction.editReply({ files: [attachment] });
	}
};
export default SpeechBubble;
