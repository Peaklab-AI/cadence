export default function LocalFirstNoAccountSoftware() {
  return (
    <>
      <p>
        Many new apps begin with creating an account, verifying email, and waiting for server confirmation before
        letting you use them, even when it's unnecessary. While this makes sense for device-syncing or collaborative
        software, a lot of apps unnecessarily follow this path, defaulting to "sign up first" without a clear reason.
         
      </p>
      <p>
        A time tracker exemplifies the second kind; it logs an individual's activities on a single machine for
        personal use. No compelling reason exists for such records to reside on external servers or require another's
        login.  
      </p>

      <h2>What you give up by going local-first</h2>
      <p>
        It's worth being honest about the trade-offs, because local-first isn't free:
      </p>
      <ul>
        <li>
          <strong>No automatic sync across devices.</strong> If your data lives in one file on one Mac, that's
          where it stays unless you move it yourself.
        </li>
        <li>
          <strong>No web access.</strong> There's no browser tab you can check from a phone on the go.
        </li>
        <li>
          <strong>You're responsible for backups.</strong> A cloud account enjoys free protection; a local file
          remains unprotected unless monitored by Time Machine, iCloud Drive, or a manual backup.
        </li>
      </ul>

      <h2>What you get back</h2>
      <p>
        In exchange, a few things get simpler, and stay simple:
      </p>
      <ul>
        <li>
          <strong>Nothing to sign up for.</strong> Opening the app instantly grants you access. No passwords to
          remember, no email verification steps stand in your way to accessing your data.
        </li>
        <li>
          <strong>Nothing leaves your machine.</strong> No keystroke hits a server, no third party touches your client
          list or hours, and no data-retention policy exposes your info.
        </li>
        <li>
          <strong>It keeps working.</strong> A local-first app ensures continuous functionality, independent of server
          outages, subscription lapses, or product shutdowns; your file is yours, and the app accesses it directly.
        </li>
        <li>
          <strong>You can see exactly where your data lives.</strong> A single, accessible file you can manage as you
          please, not a locked account on remote infrastructure.
        </li>
      </ul>

      <h2>The right call depends on the tool</h2>
      <p>
        Not every app needs to be local-first, but for tracking private, personal records (like hours worked or
        invoices sent), the local-first approach makes sense: the data stays put, untouched. That's how
        <strong>Cadence</strong> works—everything in one Mac file, no accounts or tracking beyond your own hours.
      </p>
    </>
  );
}
