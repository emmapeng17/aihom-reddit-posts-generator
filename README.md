# reddit-home-decor-draft

把家居照片生成 Reddit 帖子草稿，在本地预览页编辑后手动发帖。

## 安装

```bash
python install.py
或者和agent说“帮我下载这个skill https://github.com/emmapeng17/aihom-reddit-posts-generator/settings”
```

## 启动预览服务器

```bash
python app.py
或者和agent说“帮我启动预览服务器”
```

## 使用（必须阅读）

1. 和agent说：**"帮我做 reddit 家装帖子"**等触发词
2. 上传家居照片（支持多张），照片必须是存在本地后拖动至agent对话框（必须有文件路径）
3. 单次只能生成一个帖子，暂不支持多个帖子同时预览
4. 确认所有照片上传完毕，agent 自动生成草稿并打开预览页
5. 在预览页编辑文案，点 **📋 Copy** 复制，手动粘贴到 Reddit 发帖

## 触发词

- 帮我做 reddit 家装帖子
- 开始 reddit 帖子制作流程
- 用这些图片生成 reddit 帖子

## Project Structure

```
reddit-home-decor-draft/
├── SKILL.md              # Claude Skill 定义
├── README.md
├── install.py            # 安装脚本
├── app.py                # Flask 服务器
├── draft_store.py        # 草稿读写
├── requirements.txt      # 依赖（仅 Flask）
├── data/
│   └── drafts.json       # 草稿存储
├── templates/
│   └── preview.html      # 预览页
└── static/
    ├── style.css
    └── script.js
```
