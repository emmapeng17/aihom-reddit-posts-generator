# reddit-home-decor-draft

## About

This skill helps you create Reddit post drafts from  home decor / interior design photos. It analyzes uploaded images and generates natural-sounding Reddit posts, then opens a local web preview where you can review, edit, and copy.

## When to activate

Activate when the user says any of the following (or similar variations):

- "开始reddit帖子制作流程"
- "帮我做reddit家装帖子"
- "用这些图片生成reddit帖子"
- "生成reddit室内设计帖子草稿"
- "reddit-home-decor-draft"

## Workflow

### Step 1: Ask the user to upload images

Proactively ask the user:

> Please upload your home decor photos. You can upload multiple images at once, or send them one by one. These should be  photos of interior designs — living rooms, bedrooms, kitchens, bathrooms, home offices, etc.
>
> When you're done uploading, let me know and I'll generate one post using all the images.

- Accept single or multiple images, sent in one or multiple messages
- Do NOT start generating until the user confirms all images are uploaded

### Step 1.5: Confirm all images are uploaded

After the user sends images, ask:

> Got the photo(s)! Are these all the images for this post, or do you have more to add?

Wait for the user to confirm before proceeding. If the user says they have more, wait for additional images and ask again. Only proceed when the user confirms they are done.

While collecting images, **automatically record the local file path of each attached image** — the path is visible in the attachment metadata (e.g. `C:\Users\luhui\Pictures\photo.jpg`). Store all paths as an array in `image_paths`. If a path is not available for a given image, omit it. If no paths are available at all, use `[]`.

### Step 2: Analyze all images together

Treat all uploaded images as belonging to one single post. For each image, briefly note:

- What type of room it is (living room, bedroom, kitchen, etc.)
- Key furniture and decor items visible
- Color palette and overall style

Keep your analysis factual — only describe what you can actually see.

### Step 3: Generate one post draft

Generate a single Reddit post draft that incorporates all the uploaded images. Follow these rules:

#### Title guidelines

- English only
- 5-15 words
- Casual, like a real Reddit user wrote it
- Can be a question asking for advice, or a simple statement sharing the space
- Examples:
  - "Help me figure out a rug for this bedroom"
  - "Just moved in — how should I arrange this living room?"
  - "My small apartment setup so far, any tips?"
  - "Thoughts on this kitchen color combo?"
  - "First time decorating on my own, how did I do?"

#### Body guidelines

- English only, 2-6 sentences
- Natural Reddit tone — casual, conversational, not formal
- Can mention made-up context (price, brand, location, when decorated, DIY vs hired help, rent vs own, family background, personal feelings about the space) — but ONLY if it helps the post feel more authentic
- Never state things as facts if they are not visible in the image unless framed as plausible personal context
- Can ask for specific advice
- Do NOT use marketing or exaggerated language. Avoid words like: stunning transformation, dream home, luxury upgrade, breathtaking, revolutionary, obsessed, game-changer
- Acceptable tone words: cozy, warm, balanced, pulled together, functional, comfortable, simple, clean, bright, calm

#### Subreddit selection

Pick the most fitting primary subreddit based on the image content:

- **Asking for styling/arrangement advice**: r/HomeDecorating, r/DesignMyRoom
- **Overall space design showcase**: r/interiordecorating, r/InteriorDesign
- **Small space / apartment**: r/ApartmentDesign, r/SmallHome
- **Cozy / warm atmosphere**: r/CozyPlaces
- **DIY / renovation / construction**: r/DIY, r/HomeImprovement
- **Bedroom / living room showcase**: r/HomeDecorating, r/AmateurRoomPorn
- **Clearly masculine-coded space**: r/malelivingspace
- **Clearly feminine-coded space**: r/femalelivingspace

Also provide 1-2 alternative subreddits.

#### Notes

Write 1-2 sentences covering all uploaded images — what rooms they show, colors, style. Keep it factual.

### Step 4: Output the draft as structured data

Output a single draft in the following JSON structure:

```json
{
  "id": "post_001",
  "image_paths": ["C:/Users/you/Pictures/img1.jpg", "C:/Users/you/Pictures/img2.jpg"],
  "image_descriptions": ["brief description of image 1", "brief description of image 2"],
  "image_count": 2,
  "title": "...",
  "body": "...",
  "subreddit": "HomeDecorating",
  "alternative_subreddits": ["DesignMyRoom"],
  "notes": "short factual analysis covering all images"
}
```

- `image_descriptions` is always an array, even for a single image (length 1).
- `image_count` is the total number of uploaded images.
- There is only one draft per session (id is always `post_001`).

### Step 5: Push draft to the local preview server

**Immediately and silently** send the draft to the local Flask server. Do NOT ask for permission or confirmation. Just do it.

**Step 5a — Write the draft to a temp file using the Write tool:**

Write the JSON array to:

```
C:/Users/luhui/AppData/Local/Temp/reddit_draft.json
```

The file must contain a JSON array with the single draft object from Step 4, for example:

```json
[{
  "id": "post_001",
  ...
}]
```

**Step 5b — POST the file to Flask using Python:**

```bash
python -c "
import urllib.request, tempfile, os, subprocess, time
path = os.path.join(tempfile.gettempdir(), 'reddit_draft.json')
with open(path, 'rb') as f:
    body = f.read()
def send():
    req = urllib.request.Request('http://localhost:5000/api/save-all', data=body, headers={'Content-Type':'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=5) as r: return r.read().decode()
try:
    print(send())
except Exception:
    subprocess.Popen(['python', 'app.py'])
    time.sleep(2)
    print(send())
"
```

### Step 6: Open the preview page automatically

After the draft is pushed, run this command to open the browser:

```bash
start http://localhost:5000
```

Then tell the user:

> Draft ready! Opening the preview page now.
>
> If the page doesn't open, visit [http://localhost:5000](http://localhost:5000) manually. If it's blank, start the server first with `python app.py`.

### Step 7: User copies and publishes manually

The preview page provides:

- **📋 Copy** next to each field (subreddit, title, body) — copies that field only
- **📋 Copy Post** — copies the full formatted post
- **Copy All Drafts** in the header — copies all drafts at once

The user then pastes into Reddit and publishes manually. This skill does NOT publish to Reddit directly.

## Important rules

1. **No confirmation prompts**: Never ask the user to confirm file writes, overwrites, or any internal action. Steps 2–6 run automatically once the user says they are done uploading. The only interaction point is Step 1.5 (are all images uploaded?).
2. **One post per session**: All uploaded images produce exactly one post draft. Do not split into multiple posts.
3. **No auto-publish**: This tool never publishes to Reddit. The user copies and pastes manually.
4. **Honest tone**: Posts should sound like a real person sharing their home. Not a brand, not an influencer, not AI slop.
5. **English output**: All generated titles and bodies must be in English.

## Subreddit rules reference

Always remind users to check individual subreddit rules before posting. Some key things to keep in mind:

- r/HomeDecorating: Original content, no advertising
- r/DesignMyRoom: Advice-seeking posts welcome
- r/CozyPlaces: Focus on cozy atmosphere, no people in photos
- r/AmateurRoomPorn: Must be original content, lived-in spaces
- r/DIY: Must include process/progress if showing a project

