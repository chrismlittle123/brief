# Brief MVP Ideas

## Slack Reminder Bot (Fun Feature)

**The Friday Shame Bot**

At 16:00 UK time every Friday, Brief sends a reminder to a designated Slack channel and tags any engineer who hasn't submitted their weekly update.

The twist: all reminders must use film and TV references to humorously shame the delinquent updaters.

### Example Messages

- "@john @sarah - *You can't handle the update!* Submit your weekly Brief before the weekend. The truth is out there... in your unfinished tasks."

- "@mike - *Winter is coming...* and so is Monday. Your update is still MIA. Don't make us send the Night's Watch."

- "@emma - *I'll be back...* to check if you've done your update. Hasta la vista, procrastination."

- "@dev-team - *Houston, we have a problem.* 3 engineers haven't submitted updates. One small step for an engineer, one giant leap for team visibility."

- "@alex - *You're gonna need a bigger update.* That blank submission form is looking pretty empty, chief."

- "@chris - *I see dead updates...* Oh wait, that's because yours doesn't exist yet. Sixth sense says you should submit one."

- "@team - *Nobody puts updates in a corner.* Except @tom @lisa who apparently did. Time to dance with that keyboard."

### Implementation Notes

- Integrate with Slack API
- Schedule cron job for 16:00 UK time Fridays
- Query Notion database for missing updates (current week)
- Rotate through a library of film/TV reference templates
- Consider adding escalation levels (gentle reminder → medium shame → full roast)
