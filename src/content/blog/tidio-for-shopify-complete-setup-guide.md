---
title: "Tidio for Shopify: Complete Setup Guide 2026 — Free AI Live Chat That Resolves 70% of Queries"
description: "How to install Tidio on Shopify, configure Lyro AI to resolve 70% of support queries automatically, set up order status flows, and replace Gorgias for free. Step-by-step in 30 minutes."
publishDate: "2026-03-20"
updatedDate: "2026-04-14"
category: "support"
badge: "Free Setup"
badgeType: "new"
readTime: 12
canonical: "https://stackarchitect.xyz/blog/tidio-for-shopify-complete-setup-guide"
faqs:
  - question: "Is Tidio free for Shopify?"
    answer: "Yes. Tidio's free plan includes live chat, basic chatbot flows, and 50 Lyro AI conversations per month. This covers the full support volume of most Shopify stores under £30,000 per month GMV. Paid plans extend the Lyro AI conversation limit and add advanced features."
  - question: "Can Tidio replace Gorgias for Shopify?"
    answer: "Yes, for most stores. Tidio's Lyro AI resolves approximately 70% of inbound support queries automatically — order status, shipping questions, product FAQs — without human intervention. Gorgias costs £60–£300/month. Tidio's free tier is permanently functional, not a crippled trial."
  - question: "How does Tidio Lyro AI work?"
    answer: "Lyro AI is a generative language model trained on your FAQ content and Shopify product catalogue. It reads customer queries and responds using your knowledge base content, resolving queries without human agents. Unresolved queries are escalated to a human agent automatically. Setup involves uploading FAQ content in the Lyro configuration panel."
  - question: "Does Tidio integrate with Shopify orders?"
    answer: "Yes. Tidio's native Shopify integration pulls live order data — order status, tracking numbers, fulfilment status, and purchase history — directly into the chat sidebar. Both Lyro AI and human agents can see this data without switching systems."
  - question: "What is the Tidio Lyro AI resolution rate?"
    answer: "Tidio reports an average Lyro AI resolution rate of approximately 70% of inbound queries. However, the actual rate depends heavily on knowledge base quality and query routing configuration. Default settings typically achieve 25–35% resolution. The performance guide in this post covers the configuration required to reach 70%."
relatedGuides:
  - title: "Tidio vs Gorgias for Shopify — Full comparison 2026"
    href: "/blog/tidio-vs-gorgias-shopify"
  - title: "CAPI Shield — Free server-side tracking for Shopify"
    href: "/capi-shield"
  - title: "The $0 automation stack — all free tools"
    href: "/"
  - title: "Make.com for Shopify — Free automation guide"
    href: "/blog/make-com-shopify-automation-guide"
---

# Tidio for Shopify: Complete Setup Guide 2026 — Free AI Live Chat That Resolves 70% of Queries

Order status, shipping questions, and product FAQs account for 60–70% of all Shopify support volume. Tidio's Lyro AI resolves them automatically — without a human agent, without a helpdesk subscription, and without a monthly fee on the free plan.

This guide covers the complete setup: installation, widget configuration, Lyro AI training, chatbot flows, Shopify order sync, and the tuning routine that separates stores achieving 70% resolution from those stuck at 30%.

## Why Tidio Works for Shopify Stores

Most Shopify merchants overpay for customer support infrastructure. Gorgias costs £60–£300/month. Zendesk costs more. Both assume a human agent is in the loop for most conversations.

Tidio's Lyro AI reads and responds to queries using a generative language model trained on your FAQ content and Shopify product catalogue — resolving approximately 70% of inbound queries without human intervention, and escalating the remainder automatically.

The free tier covers 50 Lyro AI conversations per month. For stores under £30,000/month GMV, this handles the full support volume. Above that threshold, paid plans extend the conversation limit.

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

Lyro AI's performance depends almost entirely on the quality of your FAQ content. Default resolution rates are 25–35%. Reaching 70% requires deliberate knowledge base construction.

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

## The Weekly Tuning Routine That Gets You to 70%

Most stores set up Lyro and never touch it again. This is why they stay at 30% resolution. The stores reaching 70% review Lyro's performance weekly and update the knowledge base based on what Lyro got wrong.

**Weekly review (20 minutes):**

1. In Lyro AI → Analytics, filter conversations to "Escalated to agent" — these are queries Lyro could not resolve
2. Read through the last week's escalations — look for patterns. Are there 5+ queries about the same topic that Lyro keeps getting wrong?
3. Write new FAQ pairs for those topics and add them to the knowledge base
4. In "Resolved by Lyro", read a sample of 10–15 successful resolutions — verify Lyro's answers are accurate and appropriate

After 4–6 weeks of weekly tuning, most stores reach 60–70% resolution rates. The improvement comes entirely from expanding and refining the FAQ content — not from any technical configuration.

## Free Plan Limits and When to Upgrade

**Free plan includes:**
- Live chat
- Basic chatbot flows
- 50 Lyro AI conversations/month

**When to upgrade:**

At 50 Lyro conversations/month, stores processing more than approximately 300–400 orders/month will exceed the free limit. The Tidio Starter plan at £29/month gives 200 Lyro conversations. The Tidio Growth plan at £59/month gives 2,000 conversations.

Compare this to Gorgias: £60–£300/month for a system that requires more human agent time. For the same or lower cost, Tidio's paid plans extend AI coverage.

## Getting Started Today

1. [Install Tidio from the Shopify App Store](https://affiliate.tidio.com/5kfhrx3ot6tf) — free, 2 minutes
2. Connect Shopify integration and verify order data sync
3. Configure the chat widget — position, colour, welcome message
4. Write 20 FAQ pairs and upload to Lyro's knowledge base
5. Configure escalation rules
6. Enable Lyro as first responder
7. Set a weekly calendar reminder for the 20-minute review routine

The initial setup takes 30 minutes. The weekly review routine takes 20 minutes. Four to six weeks later, Lyro is resolving 60–70% of inbound queries without human intervention — freeing your team for the 30–40% of queries that genuinely need a person.

The [Tidio vs Gorgias full comparison](/blog/tidio-vs-gorgias-shopify) covers the cost and feature analysis for stores currently paying for a dedicated helpdesk.
