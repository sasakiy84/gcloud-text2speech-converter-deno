import textToSpeech from "@google-cloud/text-to-speech";
import { join } from "https://deno.land/std@0.130.0/path/mod.ts";
import { parseArgs } from "@std/cli";

const args = parseArgs(Deno.args);

if (args.help || args.h || Deno.args.length === 0) {
	console.log(`
Usage: deno task start [OPTIONS] <text-file-path>

Options:
  -h, --help    Show this help message and exit
  --fileListPath    Path to the file list file. Default: fileList.txt
  --outputDir    Path to the output directory. Default: output
  --languageCode    Language code. Default: en-GB
  --voiceName    Voice name. Default: en-GB-Standard-C
  --sentenceDelimiter    Sentence delimiter. Default: (?<=[.!?])\s+
  --endOfSentenceSymbol    End of sentence symbols. Default: .

More info:
  For language codes and voice names see https://cloud.google.com/text-to-speech/docs/voices
`);
	Deno.exit(0);
}

const textFilePath = String(args._[0]);
if (!textFilePath) {
	console.error("Please provide a text file path");
	Deno.exit(1);
}
const fileListPath = args.fileListPath || "fileList.txt";
const outputDir = args.outputDir || "output";

const languageCode = args.languageCode || "en-GB";
const voiceName = args.voiceName || "en-GB-Standard-C";
const sentenceDelimiter = args.sentenceDelimiter || "(?<=[.!?])\s+";
const sentenceDelimiterRegex = new RegExp(sentenceDelimiter);
const endOfSentenceSymbol = args.endOfSentenceSymbol || ".";

await Deno.writeTextFile(fileListPath, "");

const client = new textToSpeech.TextToSpeechClient();
const convertTextToSpeechAndSave = async (text: string, fileName: string) => {
	const request: textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest =
		{
			input: { text: text },
			voice: { languageCode: languageCode, name: voiceName },
			audioConfig: { audioEncoding: "MP3" },
		};

	const [response] = await client.synthesizeSpeech(request);
	if (response.audioContent === undefined || response.audioContent === null) {
		console.log("No audio content found");
		return;
	}

	const encoder = new TextEncoder();
	const binaryData =
		typeof response.audioContent === "string"
			? encoder.encode(response.audioContent)
			: response.audioContent;

	await Deno.writeFile(join(outputDir, fileName), binaryData);
	await Deno.writeTextFile(join(outputDir, fileName.replace(".mp3", ".txt")), text);
	console.log(`Audio content written to file: ${fileName}`);
	await Deno.writeTextFile(
		fileListPath,
		`file ${join(outputDir, fileName)}\n`,
		{
			append: true,
		},
	);
};

async function main() {
	const text = await Deno.readTextFile(textFilePath);
	const sentences = text.split(sentenceDelimiterRegex);
	const textCunks = sentences.reduce<string[]>((acc, sentence) => {
		if (acc.length === 0) {
			return [`${sentence}${endOfSentenceSymbol}`];
		}
		const lastChunk = acc[acc.length - 1];
		if (lastChunk.length + sentence.length > 4000) {
			acc.push(`${sentence}${endOfSentenceSymbol}`);
			return acc;
		}
		acc[acc.length - 1] = `${lastChunk} ${sentence}${endOfSentenceSymbol}`;
		return acc;
	}, []);

	await Deno.mkdir(outputDir, { recursive: true });

	for (let i = 0; i < textCunks.length; i++) {
		await convertTextToSpeechAndSave(textCunks[i], `output-${i}.mp3`);
	}

	console.log("Done");
	console.log(
		`To concatenate the files run:\n ffmpeg -f concat -safe 0 -i ${fileListPath} -c copy ${outputDir}/combined.mp3`,
	);
}

await main();
