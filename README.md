# DayDream Browser Ultimate — 開発環境 セットアップ

7月31日分の作業です。目標は **「開発環境が正常起動すること」**。

---

## はじめに（正直な注意）

Electron の開発だけは、**どうしても `npm install` が必要**です。これはGUIだけでは代替できません。

そこで **ダブルクリックするだけの .bat ファイル** を用意しました。黒い画面は開きますが、**文字を打つ必要は一切ありません**。

---

## 1. Node.js を入れる（初回だけ）

1. https://nodejs.org/ja を開く
2. 左側の **LTS** ボタンをクリックしてダウンロード
3. ダウンロードした `.msi` をダブルクリック
4. 「Next」を押していくだけ（設定は変更不要）

すでに入っている場合は飛ばしてください。

---

## 2. フォルダを配置する

`DayDreamBrowser` フォルダを、デスクトップなど好きな場所に置きます。中身はこの構成です。

```
DayDreamBrowser/
├── 1_セットアップ.bat
├── 2_開発起動.bat
├── 3_インストーラー作成.bat
├── 4_コード検査.bat
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.cjs
├── postcss.config.cjs
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── index.html
├── electron/
│   ├── main.cjs
│   └── preload.cjs
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── vite-env.d.ts
    ├── components/
    │   └── TitleBar.tsx
    ├── lib/
    │   └── firebase.ts
    └── types/
        └── index.ts
```

> ⚠️ フォルダ名（`electron` `src` `components` `lib` `types`）は1文字も変えないでください。

---

## 3. セットアップする

**`1_セットアップ.bat` をダブルクリック。**

5分ほどで「セットアップが完了しました」と出れば成功です。

---

## 4. 起動する

**`2_開発起動.bat` をダブルクリック。**

数秒でアプリのウィンドウが開きます。

### 画面に出るもの

- 時計
- **起動チェック** の一覧（7項目）
- 環境情報（Electron / Chromium / Node.js のバージョン）
- 8月11日までの予定表

**Electron・IPC通信・React・TypeScript・Vite・Tailwind の6項目に緑のチェックが付けば、7月31日の目標は達成です。**

Firebase だけは黄色の「…」になります。これは正常です（8月5日の作業）。

### 終わるとき

黒い画面（コマンドプロンプト）を閉じてください。

---

## 5. GitHub に登録する

1. GitHub Desktop を開く
2. **File → Add local repository** → `DayDreamBrowser` フォルダを選択
3. 「create a repository」と出たら、そのリンクをクリック
4. **Create repository** → **Publish repository**
5. 迷ったら **Keep this code private** にチェックを入れてください

`node_modules` は `.gitignore` で除外済みなので、アップロードされません。

---

## 6. Firebase プロジェクトを作る（8/5に使います）

1. https://console.firebase.google.com
2. **プロジェクトを追加** → 名前を入力（例：`daydream-browser`）
3. 作成後、**⚙️ → プロジェクトの設定** → 下の方の **ウェブアプリ** を追加
4. 表示された `firebaseConfig` をコピー
5. `src/lib/firebase.ts` の `firebaseConfig` に貼り付け

貼り付けると、起動チェックのFirebaseが緑に変わります。

---

## 動作確認済みの内容

このプロジェクトは、実際に以下を実行して確認済みです。

| 検査 | 結果 |
|---|---|
| `npm install`（597パッケージ） | 成功 |
| TypeScript 型チェック | エラー 0 |
| ESLint | 警告 0 |
| 本番ビルド | 成功（397KB / gzip 109KB） |

---

## 覚えておくこと

| やりたいこと | ダブルクリックするファイル |
|---|---|
| 最初の準備 | `1_セットアップ.bat` |
| 開発を始める | `2_開発起動.bat` |
| コードを検査する | `4_コード検査.bat` |
| 配布用exeを作る | `3_インストーラー作成.bat` |

---

## トラブル対処

| 症状 | 対処 |
|---|---|
| `Node.js が見つかりません` | 手順1をやり直す。インストール後はPCを再起動 |
| `2_開発起動.bat` で何も起きない | 先に `1_セットアップ.bat` を実行したか確認 |
| ウィンドウは開くが真っ黒 | 10秒ほど待つ。Viteの起動待ちです |
| 起動チェックのElectronが ✕ | ブラウザで直接開いています。必ず `2_開発起動.bat` から |
| 文字化けする | バッチファイルは UTF-8 です。メモ帳で開き直さないでください |
| ポート5180が使用中 | 他のViteを終了するか、`vite.config.ts` の port を変更 |

---

## 明日（8月1日）

ホーム画面の作成です。この起動確認画面を、DayDreamロゴ・検索バー・時計・通知エリア・最近使ったツール・お気に入りを備えたホーム画面に置き換えます。
