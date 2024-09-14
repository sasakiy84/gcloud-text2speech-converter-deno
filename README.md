# google cloud text2speech converter

google cloud の text-to-speech を使って、テキストを音声に変換するスクリプトです。
主に英語の音声を生成するために作成しましたが、google cloud の [text-to-speech API が対応している言語](https://cloud.google.com/text-to-speech/docs/voices)であれば、変換可能です。

## セットアップ
このスクリプトは [Deno](https://deno.land/) で動作します。
Deno がインストールされていない場合は、インストールしてください。

google cloud の text-to-speech API を利用するためには、google cloud のアカウントが必要です。
また、手元の環境に google cloud の認証情報をダウンロードするために、google cloud の SDK をインストールしておく必要があります。
さらに、分割された音声ファイルを結合するために、[FFmpeg](https://ffmpeg.org/) をインストールしておく必要があります。


### google cloud の SDK のインストール
以下のページを参考に、google cloud の SDK をインストールしてください。

- https://cloud.google.com/sdk/docs/install

### google cloud の認証情報のダウンロード
以下のページを参考にして、 ADC (Application Default Credentials) の設定をします。

- https://cloud.google.com/docs/authentication/provide-credentials-adc

ここで、Google Cloud のプロジェクト ID を入力する必要があります。
そのため、事前に Google Cloud のプロジェクトを作成しておいてください。
また、そのプロジェクトにおいて、以下の text-to-speech API を有効にしておく必要があります。

- https://console.cloud.google.com/speech/text-to-speech

## 使い方

以下のように、テキストファイルを指定して、音声ファイルを生成します。

```bash
deno task start a.txt
```

すると、`output/` ディレクトリが作成され、その中に音声ファイルが生成されます。
テキストファイルが長い場合、音声ファイルが分割されるため、それらを結合するために、FFmpeg を利用します。

```bash
ffmpeg -f concat -safe 0 -i fileList.txt -c copy output/combined.mp3
```

より詳しい使い方は、以下を実行して確認してください。

```bash
deno task start --help
```