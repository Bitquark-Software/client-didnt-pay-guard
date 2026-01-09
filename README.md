# React Client Pay Guard 💸

> **"If they don't pay, the site fades away."**

A React component library designed for agencies and freelancers. It connects to your [Client Pay Guard API] to automatically fade a client's website to black if an invoice is overdue.

It features **aggressive self-healing DOM reinforcement** to prevent clients or developers from easily removing the overlay via DevTools.

## Features

- **⏱ Automatic Opacity:** Calculates opacity based on the due date. 0% (invisible) when fresh, 100% (blackout) when overdue.
- **🛡 Self-Healing DOM:** Uses `MutationObserver` to watch the DOM. If a user deletes the overlay node or changes its attributes (e.g., `display: none`), it immediately reinjects itself.
- **🔒 Scroll Locking:** Automatically disables scrolling when the opacity reaches critical levels (>= 80%).
- **👻 Randomized IDs:** Generates random element IDs on every mount to prevent static CSS overrides.
- **🚀 Lightweight:** Built with Vite in Library Mode.

## Installation

```bash
npm install react-client-pay-guard
# or
yarn add react-client-pay-guard`
```

## Usage

```tsx
import React from "react";
import { ClientGuardProvider } from "react-client-pay-guard";
import App from "./App";

const Root = () => (
  <ClientGuardProvider
    apiKey="pk_live_YOUR_API_KEY"
    projectSlug="my-client-website-he-didnt-pay"
    heading="Service Suspended"
    message="This website has been temporarily suspended due to an outstanding invoice. Please contact your developer ASAP."
  >
    <App />
  </ClientGuardProvider>
);

export default Root;
```

## Configuration

| Prop        | Type   | Required | Description                                                        |
| ----------- | ------ | -------- | ------------------------------------------------------------------ |
| apiKey      | string | Yes      | The public API key from your Admin Dashboard.                      |
| projectSlug | string | Yes      | The specific project identifier slug.                              |
| heading     | string | Yes      | The headline displayed in the overlay (e.g., "Website Suspended"). |
| message     | string | Yes      | The detailed message shown to the user.                            |

## Security Note

While this library makes it annoying and difficult for non-technical clients to bypass the overlay, client-side code can ultimately always be defeated by a knowledgeable developer with enough time.

## License

MIT © [Nova Consulting](https://novaconsulting.com.mx)
