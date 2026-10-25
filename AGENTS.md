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
- Owner dashboard uses a server-validated shared-password gate with an encrypted HttpOnly session; every private read/write validates that session before loading the service client. Existing account roles remain DB-managed; why: password-only entry must never make private data public or expose a client credential.
- Homepage car personalization lives in its own viewer/model modules, not the racing game's shared CarModel; why: visual changes must not alter racing behavior.
- Contact submissions go through `submitContact` server fn (service role insert, honeypot, per-IP-hash rate limit); table has no anon grants; why: spam control and private data.
