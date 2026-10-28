import contextlib
import io
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from tools.convert_paper_note import PaperNoteConverter


class ConverterTests(unittest.TestCase):
  def setUp(self):
    self.temp = tempfile.TemporaryDirectory()
    self.addCleanup(self.temp.cleanup)
    self.root = Path(self.temp.name)
    self.raw = self.root / 'raw'
    self.raw.mkdir()
    self.note = self.raw / 'note.md'
    self.note.write_text('# A note\n', encoding='utf-8')
    self.posts = self.root / 'posts'
    self.images = self.root / 'images'
    self.converter = PaperNoteConverter()

  def convert(self, **kwargs):
    params = dict(input_file=str(self.note), title='Paper', date='2025-11-24',
                  output_dir=self.posts, images_output_dir=self.images)
    params.update(kwargs)
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
      return self.converter.convert_note(**params)

  def test_offline_id_and_image_copy_preserve_alt(self):
    (self.raw / 'figure.png').write_bytes(b'figure')
    self.note.write_text('arXiv:2504.16054v2\n![A useful description](figure.png)')
    with patch('urllib.request.urlopen', side_effect=AssertionError('must be offline')):
      self.assertTrue(self.convert())
    post = (self.posts / '2025-11-24-paper.md').read_text()
    self.assertIn('published: false', post)
    self.assertIn('![A useful description](/img/arxiv-2504.16054v2/figure.png)', post)
    self.assertEqual((self.images / 'arxiv-2504.16054v2/figure.png').read_bytes(), b'figure')

  def test_missing_image_fails_before_copy_or_post_write(self):
    (self.raw / 'ok.png').write_bytes(b'ok')
    self.note.write_text('![ok](ok.png)\n![missing](missing.png)')
    self.assertFalse(self.convert())
    self.assertFalse(self.posts.exists())
    self.assertFalse(self.images.exists())

  def test_existing_article_is_preserved_unless_force_is_explicit(self):
    self.assertTrue(self.convert())
    post = self.posts / '2025-11-24-paper.md'
    old = post.read_bytes()
    self.note.write_text('changed')
    self.assertFalse(self.convert())
    self.assertEqual(post.read_bytes(), old)
    self.assertTrue(self.convert(force=True))
    self.assertIn('changed', post.read_text())

  def test_colliding_images_fail_before_copying(self):
    for folder, data in [('a', b'first'), ('b', b'second')]:
      (self.raw / folder).mkdir()
      (self.raw / folder / 'same.png').write_bytes(data)
    self.note.write_text('![first](a/same.png)\n![second](b/same.png)')
    self.assertFalse(self.convert())
    self.assertFalse(self.images.exists())

  def test_existing_image_is_not_overwritten(self):
    self.images.mkdir()
    (self.images / 'same.png').write_bytes(b'original')
    (self.raw / 'same.png').write_bytes(b'changed')
    self.note.write_text('![image](same.png)')
    self.assertFalse(self.convert())
    self.assertEqual((self.images / 'same.png').read_bytes(), b'original')

  def test_paths_cannot_escape_input_or_output(self):
    (self.root / 'private.png').write_bytes(b'private')
    self.note.write_text('![image](../private.png)')
    self.assertFalse(self.convert())
    self.note.write_text('plain content')
    self.assertFalse(self.convert(slug='../escape'))
    self.assertFalse(self.convert(slug='/absolute'))
    self.assertFalse(self.posts.exists())

  def test_symlink_cannot_escape_image_output(self):
    self.images.mkdir()
    (self.images / 'same.png').symlink_to(self.root / 'outside.png')
    (self.raw / 'same.png').write_bytes(b'image')
    self.note.write_text('![image](same.png)')
    self.assertFalse(self.convert())
    self.assertFalse((self.root / 'outside.png').exists())

  def test_invalid_date_has_no_side_effects(self):
    self.assertFalse(self.convert(date='2025-02-30'))
    self.assertFalse(self.posts.exists())

  def test_title_is_quoted_separately_from_slug(self):
    self.assertTrue(self.convert(title='Title: "example" / 方法', slug='example'))
    post = (self.posts / '2025-11-24-example.md').read_text()
    self.assertIn('title: "Title: \\"example\\" / 方法"', post)

  def test_html_and_encoded_filenames_and_code_examples(self):
    (self.raw / 'my image.png').write_bytes(b'image')
    self.note.write_text('<img src="my%20image.png" alt="Diagram">\n'
                         '```markdown\n![example](missing.png)\n```\n'
                         '`![example](also-missing.png)`')
    self.assertTrue(self.convert())
    post = (self.posts / '2025-11-24-paper.md').read_text()
    self.assertIn('src="/img/my%20image.png" alt="Diagram"', post)
    self.assertTrue((self.images / 'my image.png').exists())

  def test_basename_input_works_from_its_own_directory(self):
    (self.raw / 'figure.png').write_bytes(b'image')
    self.note.write_text('![image](figure.png)')
    script = Path(__file__).resolve().parents[1] / 'tools/convert_paper_note.py'
    result = subprocess.run([sys.executable, str(script), 'note.md', 'Example',
                             '--output-dir', str(self.posts), '--images-output-dir', str(self.images)],
                            cwd=self.raw, capture_output=True)
    self.assertEqual(result.returncode, 0, result.stderr)
    self.assertTrue((self.images / 'figure.png').exists())

  def test_zotero_dash_metadata_without_images_creates_paper_directory(self):
    self.note.write_text("""### Meta Data

- **Title:** Zeva: In-context causal learning
- **Author:** Fu Chen; Xin Ding
- **ArXiv id:** arXiv:2608.30880
- **DOI:** [10.48550/arXiv.2608.30880](https://doi.org/10.48550/arXiv.2608.30880)
- **URL:** [http://arxiv.org/abs/2608.30880](http://arxiv.org/abs/2608.30880)
- **Abstract:** Generalizable manipulation remains difficult.
- **Research Tags:**
  - Computer Science - Robotics

## 1. 问题与背景

Keep this paragraph.
""")
    self.assertTrue(self.convert(tags=['VLA'], description='A paper note'))
    post = (self.posts / '2025-11-24-paper.md').read_text()
    self.assertTrue((self.images / 'arxiv-2608.30880').is_dir())
    self.assertIn('paper_note_header.html', post)
    self.assertIn('pdf_embed.html file=page.paper.pdf', post)
    self.assertIn('pdf: "https://arxiv.org/pdf/2608.30880"', post)
    self.assertIn('subjects: ["Computer Science - Robotics"]', post)
    self.assertIn('tags: ["VLA"]', post)
    self.assertIn('abstract: "Generalizable manipulation remains difficult."', post)
    self.assertIn('## 1. 问题与背景', post)
    self.assertIn('Keep this paragraph.', post)
    self.assertNotIn('### Meta Data', post)

  def test_attachment_figure_caption_and_unknown_metadata_are_preserved(self):
    (self.raw / 'attachments').mkdir()
    (self.raw / 'attachments/figure.png').write_bytes(b'figure')
    self.note.write_text("""### Meta Data

* **Title:** A paper
* **ArXiv id:** arXiv:2608.30880
* **Tags:** robot, learning
* **Custom field:** Keep this metadata.

## 方法

<figure>
  <img src="attachments/figure.png" alt="Architecture">
  <figcaption>图 1. Preserve this caption.</figcaption>
</figure>
""")
    self.assertTrue(self.convert())
    post = (self.posts / '2025-11-24-paper.md').read_text()
    self.assertIn('tags: ["robot", "learning"]', post)
    self.assertIn('Keep this metadata.', post)
    self.assertIn('src="/img/arxiv-2608.30880/figure.png"', post)
    self.assertIn('<figcaption>图 1. Preserve this caption.</figcaption>', post)
    self.assertEqual((self.images / 'arxiv-2608.30880/figure.png').read_bytes(), b'figure')

  def test_empty_paper_directory_cannot_escape_through_symlink(self):
    self.images.mkdir()
    (self.images / 'arxiv-2608.30880').symlink_to(self.root / 'outside')
    self.note.write_text('arXiv:2608.30880')
    self.assertFalse(self.convert())
    self.assertFalse((self.root / 'outside').exists())

  def test_zotero_embedded_image_alt_and_explicit_metadata(self):
    (self.raw / 'attachments').mkdir()
    (self.raw / 'attachments/figure.png').write_bytes(b'figure')
    self.note.write_text('![<img alt="" src="attachments/figure.png"> | 661](attachments/figure.png)')
    self.assertTrue(self.convert(paper_url='https://arxiv.org/abs/2608.30880', authors='A; B'))
    post = (self.posts / '2025-11-24-paper.md').read_text()
    self.assertIn('![论文插图](/img/arxiv-2608.30880/figure.png)', post)
    self.assertIn('authors: "A; B"', post)
    self.assertIn('pdf: "https://arxiv.org/pdf/2608.30880"', post)

  def test_cli_failure_returns_nonzero(self):
    script = Path(__file__).resolve().parents[1] / 'tools/convert_paper_note.py'
    result = subprocess.run([sys.executable, str(script), str(self.raw / 'missing.md'), 'Example',
                             '--output-dir', str(self.posts)], capture_output=True)
    self.assertNotEqual(result.returncode, 0)


if __name__ == '__main__':
  unittest.main()
