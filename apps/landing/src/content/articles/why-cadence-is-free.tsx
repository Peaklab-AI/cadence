export default function WhyCadenceIsFree() {
  return (
    <>
      <p>
        A simple time tracker for freelancers: start a timer, link it to a project, and group hours for billing. As a
        free macOS app, it's straightforward, needing no backend or subscription; the code is on GitHub.  
      </p>

      <h2>Not every tool needs to be a business</h2>
      <p>
        Often, software is presumed to require subscriptions for usefulness, with free versions seen as either
        transitional or promotional. While this makes sense for many categories, where sustained operations with
        support and uptime incur real costs.  
      </p>
      <p>
        A standalone local app without servers, accounts, or ongoing infrastructure incurs fewer costs. Post-launch,
        minimal expenses remain: no need to maintain a database or scale support. Monthly fees don't cover much,
        merely adding friction for users.  
      </p>

      <h2>Why we built it this way</h2>
      <p>
        <strong>Cadence</strong> was created by peaklab for our freelance and contract work; existing solutions were
        either overly complex project-management tools or costly subscription trackers. Instead, we developed a
        simpler local app. Given its zero-cost maintenance, releasing it as open-source was a natural choice, not a
        marketing strategy.
      </p>
      <p>
        That's also roughly how we think about small tools in general at peaklab: build what you actually need,
        keep it free where the economics genuinely allow it, and open source it so it stays useful even if we
        move on to something else. Cadence is one of those tools. If it's useful to you the same way it's useful
        to us, that's the whole business model.
      </p>
    </>
  );
}
