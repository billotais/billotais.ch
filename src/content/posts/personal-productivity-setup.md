---
title: "My Personal Productivity Setup"
description: "The tools I use daily to manage email, files, calendar, passwords, and notes — with a focus on privacy and keeping things off Big Tech."
date: 2025-06-17
tags: ["productivity", "privacy", "tools", "obsidian"]
---

I've gradually built a personal setup that keeps my data off big tech platforms while staying practical enough to use every day. Here's what I use and why.

## Infomaniak my kSuite — email, drive, calendar

My main productivity hub is [Infomaniak's my kSuite](https://www.infomaniak.com/fr/ksuite/myksuite). Infomaniak is a Swiss hosting company, which was part of the appeal — data stays in Switzerland, under Swiss privacy law, and the company doesn't run an advertising business on the side.

The suite covers the basics: email, cloud storage (kDrive), and calendar. Everything is available both in the browserm through the various infomaniak app, and most importantly for me, direclty in the native email/calendar apps on iPhone, where they sync over CalDAV and IMAP. 

The main reason I moved away from Gmail wasn't that it was broken — it worked fine. It was more that I'd rather pay a reasonable subscription fee to a company whose product is not selling my data. With Infomaniak, the deal is simple: I pay, they store my stuff.

It's also good value. For 20 CHF/year, I get 1 TB of cloud storage, allowing me to save all my important documents, which is more than enough for my needs. The email interface is clean and functional, and the calendar syncs well with my devices.

## Proton Pass — passwords and email aliases

For passwords I use [Proton Pass](https://proton.me/pass). I used to be subscribed to Bitwarden, but I prefered the Proton app, and it has all the features I need. 

The password manager is solid, with good security and a clean interface, but what really sets it apart for me is the **email alias** feature. Every time I sign up for a website or service, I create a dedicated alias rather than giving my real email address. This does two things:

1. **Spam control.** If a service starts sending junk or gets compromised, I can immediately tell which one it was and disable that alias. My inbox stays clean.
2. **Identity separation.** Tracking across services becomes much harder when every site sees a different email address.

I use two domains for this:
- A **private domain** for things linked to my real identity — subscriptions, services I care about, things where I want to look like a real person.
- An **anonymous domain** for everything else — forums, one-off signups, anything where I'd rather not leave a trace.

Setting this up took an afternoon, but the ongoing maintenance is basically zero. Proton Pass suggests an alias automatically when I fill in an email field, so there's no friction.

Once again, it doesn't cost much. I'm locked in the 12$/year plan, which gives me unlimited aliases, and I have to pay for a few domains to use with it, but it's still a small price to pay for the peace of mind and control it gives me over my online identity.

Using email aliases also gives me independant from my main email provider. If I ever decide to switch from Infomaniak, I won't have to worry about losing access to accounts tied to my email address, since all the aliases are managed through Proton Pass. I'll just change the forwarding address, and everything will keep working without a hitch.

## Obsidian — notes

For personal notes I use [Obsidian](https://obsidian.md/). I don't use [my own template](https://github.com/billotais/obsidian-template), as that one is more focused on work-related notes, but I have a similar setup for my personal vault. It's a single folder on my computer where I keep all my notes, and it syncs on all my devices with Obsidian Sync.

The thing I like most about Obsidian is that it's just Markdown files in a folder. No proprietary format, no lock-in. If Obsidian disappears tomorrow, my notes are still readable by any text editor.

## The common thread

Looking at these three tools together, the pattern is consistent: Swiss or European providers, open formats where possible, and a clear separation between "I pay for a service" and "the service uses my data as payment." It's not a particularly ideological stance — it's just a preference I've refined over time, and these tools make it easy enough that there's no real tradeoff in day-to-day usability.
