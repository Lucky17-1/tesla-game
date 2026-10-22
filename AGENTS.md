<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Owner access = `admin` row in `user_roles`, granted by a DB trigger only to the owner email once confirmed; why: no user-editable privilege path.
- Contact submissions go through `submitContact` server fn (service role insert, honeypot, per-IP-hash rate limit); table has no anon grants; why: spam control and private data.
