---
title: "Tidio for Shopify: Free AI Live Chat Setup Guide 2026"
heading: "Tidio for Shopify: Complete Setup Guide 2026, and When the Free Plan Is Enough"
description: "Install Tidio on Shopify, configure Lyro AI to answer common queries automatically, set up order status flows, and replace Gorgias for free. 30 minutes."
answer: "Tidio installs on Shopify from the App Store, and its Lyro AI answers order-status, shipping and product questions automatically. Tidio says Lyro automates around 67% of inquiries on average; that is Tidio's figure, not one we measured. The free plan covers live chat, a basic bot and Shopify order lookup. Full setup, including Lyro training, takes about 30 minutes."
publishDate: "2026-03-20"
updatedDate: "2026-09-24"
verifiedDate: "2026-08-11"
category: "support"
badge: "Free Setup"
badgeType: "new"
readTime: 12
canonical: "https://stackarchitect.xyz/blog/tidio-for-shopify-complete-setup-guide/"
faqs:
  - question: "Is Tidio free for Shopify?"
    answer: "Yes. Tidio's free plan includes live chat, basic chatbot flows, and 50 one-time Lyro AI conversations (a trial allowance, not a monthly one). This covers the full support volume of most Shopify stores under £30,000 per month GMV. Paid plans extend the Lyro AI conversation limit and add advanced features."
  - question: "Can Tidio replace Gorgias for Shopify?"
    answer: "Yes, for most stores. Tidio says Lyro automates around 67% of customer inquiries on average, such as order status, shipping questions and product FAQs, without human intervention. Gorgias costs £60–£300/month. Tidio's free tier is permanently functional, not a crippled trial."
  - question: "How does Tidio Lyro AI work?"
    answer: "Lyro AI is a generative language model trained on your FAQ content and Shopify product catalogue. It reads customer queries and responds using your knowledge base content, resolving queries without human agents. Unresolved queries are escalated to a human agent automatically. Setup involves uploading FAQ content in the Lyro configuration panel."
  - question: "Does Tidio integrate with Shopify orders?"
    answer: "Yes. Tidio's native Shopify integration pulls live order data — order status, tracking numbers, fulfilment status, and purchase history — directly into the chat sidebar. Both Lyro AI and human agents can see this data without switching systems."
  - question: "What is the Tidio Lyro AI resolution rate?"
    answer: "Tidio says Lyro automates around 67% of customer inquiries on average. That is Tidio's own average, not a figure we measured. Your rate depends mostly on how complete the knowledge base is and how queries are routed, which is what the weekly tuning routine in this post works on."
relatedGuides:
  - title: "Tidio vs Gorgias for Shopify — Full comparison 2026"
    href: "/blog/tidio-vs-gorgias-shopify/"
  - title: "CAPI Shield — Free server-side tracking for Shopify"
    href: "/capi-shield/"
  - title: "The $0 automation stack — all free tools"
    href: "/"
  - title: "Make.com for Shopify — Free automation guide"
    href: "/make-com-shopify/"
---

Order status, shipping questions and product FAQs make up much of a typical Shopify store's support inbox. Tidio's Lyro AI can answer them automatically — without a human agent, without a helpdesk subscription, and without a monthly fee on the free plan.

This guide covers the complete setup: installation, widget configuration, Lyro AI training, chatbot flows, Shopify order sync, and the tuning routine that separates stores near Tidio's reported 67% average from those stuck at 30%.

## Why Tidio Works for Shopify Stores

Most Shopify merchants overpay for customer support infrastructure. Gorgias starts at $40/month ([gorgias.com/pricing](https://www.gorgias.com/pricing), read 11 August 2026) and Zendesk at $19/month ([zendesk.com/pricing](https://www.zendesk.com/pricing/), read 23 August 2026). Both assume a human agent is in the loop for most conversations. The "£60–£300/month" this paragraph used to quote for Gorgias was an undated figure in the wrong currency, and it disagreed with our own verified record on the same site.

Tidio's Lyro AI reads and responds to queries using a generative language model trained on your FAQ content and Shopify product catalogue, and escalates what it cannot answer automatically. Tidio says Lyro automates around 67% of customer inquiries on average.

The free tier includes 50 one-time Lyro AI conversations. Whether that is enough is a question about conversation volume, not revenue: it depends on how many shoppers ask Lyro something, which is not a fixed share of GMV. The "£30,000/month GMV" threshold that stood here was invented — no source states it, and no mechanism produces it.

For how Tidio compares with the other AI tools a store might add, see [the best AI tools for Shopify](/best-ai-tools-shopify/); for where support sits among the other uses of AI in a store, see the [Shopify AI playbook](/blog/shopify-ai-playbook-2026/).

## Installation — 10 Minutes

**Step 1 — Install from the Shopify App Store**

Search "Tidio" in the Shopify App Store. Install the free app. Tidio automatically creates a live chat widget on your storefront.

**Step 2 — Connect your Shopify store data**

In the Tidio admin panel, go to **Settings → Integrations → Shopify**. Tidio connects automatically on installation but verify the integration is active — you should see your store name and a green connected status.

Once connected, Tidio pulls live order data, customer purchase history, and product catalogue into the agent sidebar. Test this by looking up a recent order through the Tidio chat interface.

**Step 3 — Configure the chat widget**

Go to **Settings → Widget**. Configure:

- **Position:** bottom-right is standard, bottom-left if you have other bottom-right CTAs
- **Colour:** match your brand (avoid the default blue — it looks generic)
- **Welcome message:** use a specific message, not "Hi! How can we help?" — try "Questions about your order? We usually reply in under 2 minutes."
- **Operator hours:** set your actual response hours. Outside those hours, route to automated responses only.

**Step 4 — Set up the Shopify data sidebar**

In Tidio's agent view, the right sidebar pulls Shopify order data for the current customer. Ensure this is configured and test it with a known customer email. Human agents should see order status, tracking number, and purchase history without leaving Tidio.

## Lyro AI Configuration — 20 Minutes

Lyro AI's performance depends almost entirely on the quality of your FAQ content. Default resolution rates are 25–35%. Getting near Tidio's reported 67% average requires deliberate knowledge base construction.

**Step 1 — Access the Lyro configuration panel**

In Tidio admin: **Lyro AI → Knowledge Base**. This is where you upload the content Lyro uses to answer queries.

**Step 2 — Write FAQs for the questions Lyro actually receives**

Write at least 20 Q&A pairs covering:

- Order status: "Where is my order?" — answer with your typical processing and shipping timelines
- Returns: "How do I return an item?" — answer with your exact return process, not a link to a policy page
- Shipping: "How long does delivery take?" — specific timelines by region
- Product questions: the 5–10 most common product questions for your top sellers
- Out of stock: "When will X be back in stock?" — answer with your restock communication process
- Discount codes: "My discount code isn't working" — answer with common causes and resolution

The more specific your FAQs, the higher Lyro's resolution rate. Vague answers produce more escalations.

**Step 3 — Upload your FAQ content**

Tidio supports plain text Q&A pairs, website URL crawling, and PDF upload. The Q&A pair format gives the most reliable results — URL crawling can include irrelevant content that confuses Lyro's responses.

**Step 4 — Configure escalation rules**

In **Lyro AI → Escalation**, set:

- If Lyro cannot resolve: route to human agent during operating hours, or collect contact details outside hours
- Escalation trigger: "connect me to a person", "speak to someone", "not helpful"
- Priority escalation: complaints about damaged items or missing orders should always route to human agents immediately

**Step 5 — Enable Lyro on your widget**

In **Settings → Widget → Chat Behaviour**, toggle Lyro AI to active. Set Lyro as the first responder for all incoming conversations. Human agents see all conversations and can take over at any point.

## Chatbot Flows for Common Queries

Beyond Lyro AI, Tidio's visual chatbot builder lets you create structured flows for predictable queries. These supplement Lyro and handle edge cases.

**Order status flow**

Trigger: visitor clicks "Check order status" in the widget menu

Flow: ask for order number → verify against Shopify → return order status, tracking link, and estimated delivery → if order not found, route to agent

**Return initiation flow**

Trigger: visitor selects "Returns" from widget menu

Flow: ask for order number and item → verify purchase → provide return instructions → if outside return window, route to agent

**Size and fit flow** (for apparel stores)

Trigger: message contains "size", "fit", "measurement"

Flow: present size guide link → ask if query is resolved → if not, route to Lyro AI for specific product questions

## The Weekly Tuning Routine

Lyro only improves if someone reviews it. The way to get closer to Tidio's reported 67% average is to review Lyro's performance weekly and update the knowledge base based on what Lyro got wrong.

**Weekly review (20 minutes):**

1. In Lyro AI → Analytics, filter conversations to "Escalated to agent" — these are queries Lyro could not resolve
2. Read through the last week's escalations — look for patterns. Are there 5+ queries about the same topic that Lyro keeps getting wrong?
3. Write new FAQ pairs for those topics and add them to the knowledge base
4. In "Resolved by Lyro", read a sample of 10–15 successful resolutions — verify Lyro's answers are accurate and appropriate

The gains come from expanding and correcting the FAQ content, not from technical settings. Measure your own resolution rate in Lyro's analytics before and after, rather than assuming a number.

Those escalation logs are worth more than the support time they save. Every repeated pre-purchase question — sizing, delivery windows, whether it fits a particular use — is a question the product page failed to answer, asked by someone motivated enough to type it. Most visitors with the same question leave instead. Feeding the top escalation topics back into your product copy is one of the cheapest conversion gains available; [free Shopify conversion rate optimisation](/blog/shopify-conversion-rate-optimisation-free-2026/) covers where on the page that content belongs.

## Free Plan Limits and When to Upgrade

**Free plan includes:**
- Live chat
- Basic chatbot flows
- 50 one-time Lyro AI conversations (not monthly)

**When to upgrade:**

Tidio lists Starter at $24.17/month and Growth from $49.17/month, both shown against an "Annually (2 months free)" toggle — so these are the annual-billing monthly equivalents, not the month-to-month price ([tidio.com/pricing](https://www.tidio.com/pricing/), read 10 September 2026). Starter lists 50 Lyro AI Agent conversations as a one-off rather than a monthly allowance, and Growth lists an upgradeable limit rather than a fixed number. The "£29/month for 200 conversations" and "£59/month for 2,000" that stood here were wrong on the currency, the price and the allowance at once. Check the current tiers against your own conversation volume before committing.

Compare this to Gorgias, from $40/month ([gorgias.com/pricing](https://www.gorgias.com/pricing), read 11 August 2026), for a system that assumes more human agent time.

## Is the free plan enough for your store?

Tidio bills by conversation, not by seat, so the decision turns on your monthly conversation count, the channels you support and who handles orders. Check the current allowances on [Tidio's pricing page](https://www.tidio.com/pricing/) against your own numbers; the reasoning below does not depend on them.

**Stay on the free plan while:**
- your monthly conversations fit inside the free allowance, and have done for a couple of months;
- you are still testing whether automated answers resolve enough of your queries to be worth paying for; the free Lyro conversations are for exactly that test;
- the "Powered by Tidio" branding on the widget does not bother your customers.

**Move to a paid Tidio plan when:**
- you regularly run out of free conversations;
- you want visitor analytics and operating hours, or email handled in the same inbox as chat.

Buy the smallest paid plan that covers your volume. Jumping from free straight to the larger plans for their analytics is the usual way to overspend.

**Consider a ticket-based helpdesk such as Gorgias instead when:**
- your conversation volume is growing fast enough that each Tidio tier is outgrown within months;
- you support customers across Instagram, Facebook, email and SMS as well as chat, which Gorgias is built around;
- your agents spend their day refunding, editing orders and applying discount codes, where a helpdesk with deeper Shopify order actions saves time.

The [Tidio vs Gorgias comparison](/blog/tidio-vs-gorgias-shopify/) covers that switch in detail.

## Getting Started Today

1. [Install Tidio free](/go/tidio/?source=tidio-for-shopify-complete-setup-guide-n1): free, 2 minutes
2. Connect Shopify integration and verify order data sync
3. Configure the chat widget — position, colour, welcome message
4. Write 20 FAQ pairs and upload to Lyro's knowledge base
5. Configure escalation rules
6. Enable Lyro as first responder
7. Set a weekly calendar reminder for the 20-minute review routine

The initial setup takes 30 minutes. The weekly review routine takes 20 minutes. Four to six weeks later, Lyro should be answering most routine queries without human intervention (Tidio's reported average is around 67%), freeing your team for the queries that genuinely need a person.



---

## Complete your free Shopify automation stack

While Tidio handles customer support, the Complete Kit covers tracking (CAPI Shield), inventory (Stocky Swap — replace Stocky before August shutdown), and P&L reporting. Four pre-built Make.com JSON blueprints, $19.99 one-time.

**[Get the Complete Kit — $19.99 →](/pro/)**


## Related App Alternatives
- [Stocky Pricing & Alternatives](/apps/stocky/)
- [Gorgias Pricing & Alternatives](/apps/gorgias/)
- [Zendesk Pricing & Alternatives](/apps/zendesk/)
