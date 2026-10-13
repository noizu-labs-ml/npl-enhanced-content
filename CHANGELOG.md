# Changelog

Dated work log — newest first, one line per landed change.

## 2026-10-13

- feat(cli): workspace path guard for semtext-agent — `--out` / edit `--in-place` targets and the edit `--content-file` read must resolve inside the working directory (symlinks followed, real target checked, refused with exit 1); `xslt --out` now actually writes to the given path; `write --in-place` removed from the help (it never worked) and rejected with a usage error; vitest-detection fix so a missing xslt-processor falls back to xsltproc instead of erroring (#feat/cli-harden).
