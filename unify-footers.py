#!/usr/bin/env python3
"""
Stack Architect — Footer Unification
Run from repo root:  python3 unify-footers.py
Converts every page with a hardcoded/old-branding footer to the shared
<Footer /> component, so the footer is defined once and consistent everywhere.
Idempotent: safe to run more than once.
"""
import re, os, sys

if not os.path.isdir("src/pages") or not os.path.isfile("src/components/Footer.astro"):
    sys.exit("ERROR: run this from the repo root (where src/ lives).")

def rel_import(path):
    # path like "src/pages/x.astro" -> depth 0 ; "src/pages/blog/x.astro" -> depth 1
    p = path.replace("\\", "/")
    inside = p.split("src/pages/", 1)[1]        # "x.astro" or "blog/x.astro"
    depth = inside.count("/")                    # subfolders below pages/
    return "../" * (depth + 1) + "components/Footer.astro"

def add_footer_import(s, path):
    if "components/Footer.astro" in s:
        return s
    imp = f"import Footer from '{rel_import(path)}';"
    m = re.search(r"import Nav from '[^']+';", s)
    if m:
        return s[:m.end()] + "\n" + imp + s[m.end():]
    # no Nav import — insert right after opening frontmatter fence
    fm = s.find("---")
    if fm != -1:
        nl = s.find("\n", fm)
        return s[:nl+1] + imp + "\n" + s[nl+1:]
    return imp + "\n" + s

def replace_footer(s):
    start = s.find("<footer")
    if start == -1:
        return s, 0
    end = s.find("</footer>", start)
    if end == -1:
        return s, 0
    end += len("</footer>")
    removed = s[start:end].count("\n") + 1
    return s[:start] + "<Footer />" + s[end:], removed

changed = 0
for root, _, files in os.walk("src/pages"):
    for fn in files:
        if not fn.endswith(".astro"):
            continue
        path = os.path.join(root, fn)
        s = open(path, encoding="utf-8").read()
        # skip embed pages (intentionally chrome-free) and 404
        if "/embed/" in path.replace("\\", "/") or fn == "404.astro":
            continue
        # only touch pages that have a hardcoded <footer> and don't already use the component
        if "<footer" in s and "<Footer" not in s:
            s2 = add_footer_import(s, path.replace("\\", "/"))
            s2, removed = replace_footer(s2)
            if removed:
                open(path, "w", encoding="utf-8").write(s2)
                print(f"  converted {path}  (-{removed} lines)")
                changed += 1
        # special case: page has NO footer at all but a </main> — insert the shared one
        elif "<Footer" not in s and "</main>" in s and "</header>" not in s.rsplit("</main>", 1)[1][:200]:
            # only when there is genuinely no footer anywhere in the page
            if "<footer" not in s:
                s2 = add_footer_import(s, path.replace("\\", "/"))
                idx = s2.rfind("</main>") + len("</main>")
                s2 = s2[:idx] + "\n\n<Footer />\n" + s2[idx:]
                open(path, "w", encoding="utf-8").write(s2)
                print(f"  added footer to {path} (had none)")
                changed += 1

print(f"\nDone. Converted {changed} page(s) to the shared <Footer /> component.")
print("Next: npx astro build   then commit & push.")
