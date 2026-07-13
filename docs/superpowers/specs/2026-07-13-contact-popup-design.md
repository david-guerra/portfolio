# Contact Popup Design

## Goal

Give portfolio visitors a direct way to contact David without publishing his personal email address or adding an application backend. The contact path should feel lightweight, work on the static GitHub Pages deployment, and provide LinkedIn as a visible alternative when form delivery is unavailable.

## Scope

This feature adds:

- a centered contact dialog opened from the navigation and About section;
- separate GitHub and LinkedIn profile links;
- a minimal Web3Forms form with name, email, message, and hCaptcha;
- explicit sending, success, failure, and unavailable states;
- deployment configuration for the existing Web3Forms access key; and
- automated delivery tests plus browser-level interaction checks.

Custom-domain email, attachments, auto-replies, saved drafts, analytics, a portfolio backend, and local persistence are outside this feature.

## Visitor Experience

The navigation presents `GitHub ↗`, `LinkedIn ↗`, and a stronger `Contact` action. The About section repeats the profile links and presents `Say hello →`. `Contact` and `Say hello →` open the same centered dialog; the profile links navigate directly to their respective external profiles.

The dialog uses the accessible heading `Contact` and contains only:

1. Name
2. Email
3. Message
4. hCaptcha
5. `Send message`

On desktop, the dialog is a compact card centered over the page. On mobile, it becomes nearly full width with comfortable page margins rather than taking over the entire screen. It can be dismissed with its close button, Escape, or a backdrop click. Keyboard focus moves into the dialog when it opens and returns to the trigger that opened it when it closes.

Closing an unfinished form does not write its contents to storage. The mounted dialog may retain those values for the current page session so an accidental close does not destroy the message; a reload clears them.

While a request is active, the submit button is disabled and communicates that the message is sending. Successful delivery replaces the form in place with:

> Message sent! I’ll get back to you soon.

The success state includes a close button. Closing it resets the form and hCaptcha for a future message.

If delivery fails, the entered values remain intact and the dialog shows:

> Couldn’t send that right now. Try again, or reach me on LinkedIn.

`LinkedIn` in the failure message links directly to `https://linkedin.com/in/david-guerrasal`. The visitor can retry without re-entering the form.

## Component Boundaries

The page shell owns whether the dialog is open and remembers the trigger element that opened it. Both contact actions call the same open function, and the page shell restores focus after close.

A dedicated `ContactDialog` owns the native `<dialog>` element, form fields, hCaptcha integration, and the visible state machine:

- `idle`
- `submitting`
- `success`
- `error`
- `unavailable`

A separate Web3Forms delivery function receives validated form data, the hCaptcha token, and the configured access key. It sends the request and converts Web3Forms responses into a small result type understood by the dialog. This boundary keeps network and response handling testable without rendering the interface.

The implementation uses the official React hCaptcha component recommended by Web3Forms. The token is included with the submission, and the widget is reset after success or when a failed verification requires a fresh token.

## Delivery and Configuration

The browser posts directly to `https://api.web3forms.com/submit`; no portfolio-owned server is introduced.

The existing GitHub Actions secret named `WEB3FORMS_ACCESS_KEY` is exposed to the Vite deployment build as `VITE_WEB3FORMS_ACCESS_KEY`. This keeps configuration out of the repository and makes rotation straightforward. It does not make the deployed value secret: Vite embeds client environment variables in the browser bundle, and Web3Forms intentionally treats the access key as a public routing identifier.

If the access key is absent, the production build still succeeds. The dialog enters the `unavailable` state, does not attempt a request, and directs the visitor to LinkedIn. The deployment workflow must pass the existing Actions secret to the build before the form can deliver messages on GitHub Pages.

Web3Forms server-side filtering and a required hCaptcha protect the inbox from routine form spam. No email address is rendered in the page. The access key cannot be treated as an authorization boundary; making delivery credentials genuinely private would require a server-side endpoint and belongs to a future hosting change.

Beneath the form, a short disclosure reads:

> Protected by hCaptcha. Messages are processed by Web3Forms.

`Web3Forms` links to `https://web3forms.com/privacy`. The form does not persist submissions or drafts in the portfolio application. Web3Forms and hCaptcha process visitor data outside the portfolio itself; a broader site privacy/legal review is a separate launch-readiness concern, not implied legal sign-off from this feature spec.

## Error Handling

Client validation requires all three visitor fields, a syntactically valid email address, and an hCaptcha token before submission. Repeated clicks cannot create concurrent requests.

The delivery layer distinguishes successful responses from rejected requests, rate limiting, and network failures for testing and diagnostics. The visitor-facing error remains short and does not expose provider payloads or internal configuration. Failed submissions preserve the entered values. A missing access key is handled before any network request.

## Verification

Automated tests for the delivery boundary cover:

- missing access-key configuration without a network request;
- a successful Web3Forms response;
- a rejected Web3Forms response;
- rate limiting; and
- network failure.

Browser verification covers:

- opening the same dialog from navigation and About;
- keyboard-only operation, Escape, close button, backdrop dismissal, and focus restoration;
- desktop and mobile sizing without page overflow;
- required-field and email validation;
- hCaptcha completion and reset behavior;
- prevention of duplicate submissions;
- exact success copy;
- preserved field values and LinkedIn fallback after failure;
- the unavailable state when the access key is omitted; and
- a real successful submission from the deployed GitHub Pages site.

The later portfolio launch pass repeats the deployed end-to-end submission check.

## Tracker Boundary

Implementation belongs in its own Wayfinder child task, **Contact popup and Web3Forms delivery**. It follows the navigation and design-system work and must be complete before the launch pass. The current content ticket records the contact decision and copy but does not implement the modal.

## References

- [Web3Forms API reference](https://docs.web3forms.com/getting-started/api-reference)
- [Web3Forms access-key and spam FAQ](https://docs.web3forms.com/getting-started/faq)
- [Web3Forms hCaptcha guide](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha)
- [Web3Forms privacy policy](https://web3forms.com/privacy)
