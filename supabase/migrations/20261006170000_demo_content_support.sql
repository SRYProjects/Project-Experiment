-- Support clearly labeled fictional Example content without creating fake auth users.
-- Real participation remains tied to auth-backed profiles and real project statistics
-- continue to exclude rows where is_demo = true.

alter table public.meaningful_actions
  add column demo_username text null;

alter table public.meaningful_actions
  alter column user_id drop not null;

alter table public.meaningful_actions
  add constraint meaningful_actions_identity_check
  check (
    (
      is_demo = false
      and user_id is not null
      and demo_username is null
    )
    or
    (
      is_demo = true
      and user_id is null
      and demo_username is not null
      and demo_username = lower(demo_username)
      and demo_username ~ '^[a-z0-9_]{3,30}$'
    )
  );

alter table public.discoveries
  add column demo_username text null;

alter table public.discoveries
  alter column user_id drop not null;

alter table public.discoveries
  add constraint discoveries_identity_check
  check (
    (
      is_demo = false
      and user_id is not null
      and demo_username is null
    )
    or
    (
      is_demo = true
      and user_id is null
      and demo_username is not null
      and demo_username = lower(demo_username)
      and demo_username ~ '^[a-z0-9_]{3,30}$'
    )
  );

insert into public.meaningful_actions
  (user_id, demo_username, category, action_text, moderation_status, is_demo, created_at, moderated_at)
values
  (null, 'steady_steps', 'Health'::public.action_category, 'Took a thirty-minute walk before opening email.', 'published'::public.moderation_status, true, '2026-10-06T16:20:00.000Z'::timestamptz, '2026-10-06T16:20:00.000Z'::timestamptz),
  (null, 'steady_steps', 'Responsibility'::public.action_category, 'Finished the household task I had postponed all week.', 'published'::public.moderation_status, true, '2026-10-06T15:13:00.000Z'::timestamptz, '2026-10-06T15:13:00.000Z'::timestamptz),
  (null, 'steady_steps', 'Relationships'::public.action_category, 'Called a friend and listened without multitasking.', 'published'::public.moderation_status, true, '2026-10-06T14:06:00.000Z'::timestamptz, '2026-10-06T14:06:00.000Z'::timestamptz),
  (null, 'steady_steps', 'Sacrifice'::public.action_category, 'Turned off the television and went to bed early.', 'published'::public.moderation_status, true, '2026-10-06T12:59:00.000Z'::timestamptz, '2026-10-06T12:59:00.000Z'::timestamptz),
  (null, 'carefirst', 'Family'::public.action_category, 'Made dinner for my parents and stayed to eat with them.', 'published'::public.moderation_status, true, '2026-10-06T11:52:00.000Z'::timestamptz, '2026-10-06T11:52:00.000Z'::timestamptz),
  (null, 'carefirst', 'Service'::public.action_category, 'Picked up groceries for a neighbor who could not get out.', 'published'::public.moderation_status, true, '2026-10-06T10:45:00.000Z'::timestamptz, '2026-10-06T10:45:00.000Z'::timestamptz),
  (null, 'carefirst', 'Relationships'::public.action_category, 'Asked someone how they were doing and waited for the real answer.', 'published'::public.moderation_status, true, '2026-10-06T09:38:00.000Z'::timestamptz, '2026-10-06T09:38:00.000Z'::timestamptz),
  (null, 'carefirst', 'Responsibility'::public.action_category, 'Handled an uncomfortable phone call instead of putting it off.', 'published'::public.moderation_status, true, '2026-10-06T08:31:00.000Z'::timestamptz, '2026-10-06T08:31:00.000Z'::timestamptz),
  (null, 'earlywalker', 'Health'::public.action_category, 'Went outside for a walk before the rest of the day took over.', 'published'::public.moderation_status, true, '2026-10-06T07:24:00.000Z'::timestamptz, '2026-10-06T07:24:00.000Z'::timestamptz),
  (null, 'earlywalker', 'Learning'::public.action_category, 'Read twenty pages of the book I keep saying matters to me.', 'published'::public.moderation_status, true, '2026-10-06T06:17:00.000Z'::timestamptz, '2026-10-06T06:17:00.000Z'::timestamptz),
  (null, 'earlywalker', 'Sacrifice'::public.action_category, 'Left my phone at home during my morning walk.', 'published'::public.moderation_status, true, '2026-10-06T05:10:00.000Z'::timestamptz, '2026-10-06T05:10:00.000Z'::timestamptz),
  (null, 'earlywalker', 'Creativity'::public.action_category, 'Spent half an hour sketching before checking the news.', 'published'::public.moderation_status, true, '2026-10-06T04:03:00.000Z'::timestamptz, '2026-10-06T04:03:00.000Z'::timestamptz),
  (null, 'makingroom', 'Family'::public.action_category, 'Cleared my evening schedule to attend my daughter''s school event.', 'published'::public.moderation_status, true, '2026-10-06T02:56:00.000Z'::timestamptz, '2026-10-06T02:56:00.000Z'::timestamptz),
  (null, 'makingroom', 'Sacrifice'::public.action_category, 'Said no to an optional meeting so I could keep a family commitment.', 'published'::public.moderation_status, true, '2026-10-06T01:49:00.000Z'::timestamptz, '2026-10-06T01:49:00.000Z'::timestamptz),
  (null, 'makingroom', 'Relationships'::public.action_category, 'Put my laptop away when my partner started talking.', 'published'::public.moderation_status, true, '2026-10-06T00:42:00.000Z'::timestamptz, '2026-10-06T00:42:00.000Z'::timestamptz),
  (null, 'makingroom', 'Responsibility'::public.action_category, 'Blocked time for the work I had been avoiding.', 'published'::public.moderation_status, true, '2026-10-05T23:35:00.000Z'::timestamptz, '2026-10-05T23:35:00.000Z'::timestamptz),
  (null, 'kindwork', 'Work'::public.action_category, 'Gave a colleague credit for the idea they contributed.', 'published'::public.moderation_status, true, '2026-10-05T22:28:00.000Z'::timestamptz, '2026-10-05T22:28:00.000Z'::timestamptz),
  (null, 'kindwork', 'Service'::public.action_category, 'Stayed ten minutes late to help a coworker finish a difficult task.', 'published'::public.moderation_status, true, '2026-10-05T21:21:00.000Z'::timestamptz, '2026-10-05T21:21:00.000Z'::timestamptz),
  (null, 'kindwork', 'Relationships'::public.action_category, 'Apologized directly instead of defending what I meant.', 'published'::public.moderation_status, true, '2026-10-05T20:14:00.000Z'::timestamptz, '2026-10-05T20:14:00.000Z'::timestamptz),
  (null, 'kindwork', 'Responsibility'::public.action_category, 'Sent the difficult follow-up I had been postponing.', 'published'::public.moderation_status, true, '2026-10-05T19:07:00.000Z'::timestamptz, '2026-10-05T19:07:00.000Z'::timestamptz),
  (null, 'learnonpurpose', 'Learning'::public.action_category, 'Practiced the skill I want to improve for forty focused minutes.', 'published'::public.moderation_status, true, '2026-10-05T18:00:00.000Z'::timestamptz, '2026-10-05T18:00:00.000Z'::timestamptz),
  (null, 'learnonpurpose', 'Learning'::public.action_category, 'Wrote down what I misunderstood instead of pretending I knew it.', 'published'::public.moderation_status, true, '2026-10-05T16:53:00.000Z'::timestamptz, '2026-10-05T16:53:00.000Z'::timestamptz),
  (null, 'learnonpurpose', 'Sacrifice'::public.action_category, 'Skipped an hour of scrolling to study something important to me.', 'published'::public.moderation_status, true, '2026-10-05T15:46:00.000Z'::timestamptz, '2026-10-05T15:46:00.000Z'::timestamptz),
  (null, 'learnonpurpose', 'Work'::public.action_category, 'Asked for feedback on work I usually keep to myself.', 'published'::public.moderation_status, true, '2026-10-05T14:39:00.000Z'::timestamptz, '2026-10-05T14:39:00.000Z'::timestamptz),
  (null, 'homefirst', 'Family'::public.action_category, 'Sat at the table for breakfast instead of eating while working.', 'published'::public.moderation_status, true, '2026-10-05T13:32:00.000Z'::timestamptz, '2026-10-05T13:32:00.000Z'::timestamptz),
  (null, 'homefirst', 'Family'::public.action_category, 'Helped with homework without keeping one eye on my phone.', 'published'::public.moderation_status, true, '2026-10-05T12:25:00.000Z'::timestamptz, '2026-10-05T12:25:00.000Z'::timestamptz),
  (null, 'homefirst', 'Responsibility'::public.action_category, 'Fixed the small thing at home I had ignored for months.', 'published'::public.moderation_status, true, '2026-10-05T11:18:00.000Z'::timestamptz, '2026-10-05T11:18:00.000Z'::timestamptz),
  (null, 'homefirst', 'Relationships'::public.action_category, 'Planned an evening around my family instead of squeezing them in.', 'published'::public.moderation_status, true, '2026-10-05T10:11:00.000Z'::timestamptz, '2026-10-05T10:11:00.000Z'::timestamptz),
  (null, 'creativehour', 'Creativity'::public.action_category, 'Wrote one page before deciding whether it was any good.', 'published'::public.moderation_status, true, '2026-10-05T09:04:00.000Z'::timestamptz, '2026-10-05T09:04:00.000Z'::timestamptz),
  (null, 'creativehour', 'Creativity'::public.action_category, 'Played music for an hour with no plan to post or perform it.', 'published'::public.moderation_status, true, '2026-10-05T07:57:00.000Z'::timestamptz, '2026-10-05T07:57:00.000Z'::timestamptz),
  (null, 'creativehour', 'Sacrifice'::public.action_category, 'Closed social media and used the time to make something.', 'published'::public.moderation_status, true, '2026-10-05T06:50:00.000Z'::timestamptz, '2026-10-05T06:50:00.000Z'::timestamptz),
  (null, 'creativehour', 'Learning'::public.action_category, 'Studied a technique I have wanted to learn and tried it immediately.', 'published'::public.moderation_status, true, '2026-10-05T05:43:00.000Z'::timestamptz, '2026-10-05T05:43:00.000Z'::timestamptz),
  (null, 'servequietly', 'Service'::public.action_category, 'Cleaned up a shared space without waiting to be asked.', 'published'::public.moderation_status, true, '2026-10-05T04:36:00.000Z'::timestamptz, '2026-10-05T04:36:00.000Z'::timestamptz),
  (null, 'servequietly', 'Service'::public.action_category, 'Donated supplies to the local pantry on my way home.', 'published'::public.moderation_status, true, '2026-10-05T03:29:00.000Z'::timestamptz, '2026-10-05T03:29:00.000Z'::timestamptz),
  (null, 'servequietly', 'Relationships'::public.action_category, 'Checked on someone who has been having a difficult week.', 'published'::public.moderation_status, true, '2026-10-05T02:22:00.000Z'::timestamptz, '2026-10-05T02:22:00.000Z'::timestamptz),
  (null, 'servequietly', 'Sacrifice'::public.action_category, 'Gave up part of my Saturday to help with a community event.', 'published'::public.moderation_status, true, '2026-10-05T01:15:00.000Z'::timestamptz, '2026-10-05T01:15:00.000Z'::timestamptz),
  (null, 'honestpause', 'Responsibility'::public.action_category, 'Admitted I had made the mistake before anyone else had to point it out.', 'published'::public.moderation_status, true, '2026-10-05T00:08:00.000Z'::timestamptz, '2026-10-05T00:08:00.000Z'::timestamptz),
  (null, 'honestpause', 'Relationships'::public.action_category, 'Paused an argument and came back when I could listen better.', 'published'::public.moderation_status, true, '2026-10-04T23:01:00.000Z'::timestamptz, '2026-10-04T23:01:00.000Z'::timestamptz),
  (null, 'honestpause', 'Health'::public.action_category, 'Took a real lunch break instead of working through it again.', 'published'::public.moderation_status, true, '2026-10-04T21:54:00.000Z'::timestamptz, '2026-10-04T21:54:00.000Z'::timestamptz),
  (null, 'honestpause', 'Work'::public.action_category, 'Removed one unnecessary commitment from my week.', 'published'::public.moderation_status, true, '2026-10-04T20:47:00.000Z'::timestamptz, '2026-10-04T20:47:00.000Z'::timestamptz),
  (null, 'keepfaith', 'Faith'::public.action_category, 'Set aside quiet time for prayer before starting the day.', 'published'::public.moderation_status, true, '2026-10-04T19:40:00.000Z'::timestamptz, '2026-10-04T19:40:00.000Z'::timestamptz),
  (null, 'keepfaith', 'Faith'::public.action_category, 'Went to the service I had been tempted to skip.', 'published'::public.moderation_status, true, '2026-10-04T18:33:00.000Z'::timestamptz, '2026-10-04T18:33:00.000Z'::timestamptz),
  (null, 'keepfaith', 'Service'::public.action_category, 'Reached out to someone in my community who has been alone.', 'published'::public.moderation_status, true, '2026-10-04T17:26:00.000Z'::timestamptz, '2026-10-04T17:26:00.000Z'::timestamptz),
  (null, 'showupdaily', 'Work'::public.action_category, 'Completed the proposal before polishing anything else.', 'published'::public.moderation_status, true, '2026-10-04T16:19:00.000Z'::timestamptz, '2026-10-04T16:19:00.000Z'::timestamptz),
  (null, 'showupdaily', 'Responsibility'::public.action_category, 'Kept the appointment I wanted to cancel because I felt tired.', 'published'::public.moderation_status, true, '2026-10-04T15:12:00.000Z'::timestamptz, '2026-10-04T15:12:00.000Z'::timestamptz),
  (null, 'showupdaily', 'Health'::public.action_category, 'Prepared tomorrow''s lunch instead of leaving the choice to convenience.', 'published'::public.moderation_status, true, '2026-10-04T14:05:00.000Z'::timestamptz, '2026-10-04T14:05:00.000Z'::timestamptz),
  (null, 'lessbutbetter', 'Sacrifice'::public.action_category, 'Cancelled a low-value commitment to protect time for what matters.', 'published'::public.moderation_status, true, '2026-10-04T12:58:00.000Z'::timestamptz, '2026-10-04T12:58:00.000Z'::timestamptz),
  (null, 'lessbutbetter', 'Responsibility'::public.action_category, 'Deleted three tasks that did not deserve to stay on my list.', 'published'::public.moderation_status, true, '2026-10-04T11:51:00.000Z'::timestamptz, '2026-10-04T11:51:00.000Z'::timestamptz),
  (null, 'lessbutbetter', 'Work'::public.action_category, 'Worked on one important problem without opening chat or email.', 'published'::public.moderation_status, true, '2026-10-04T10:44:00.000Z'::timestamptz, '2026-10-04T10:44:00.000Z'::timestamptz),
  (null, 'presentten', 'Relationships'::public.action_category, 'Spent ten uninterrupted minutes talking with my son.', 'published'::public.moderation_status, true, '2026-10-04T09:37:00.000Z'::timestamptz, '2026-10-04T09:37:00.000Z'::timestamptz),
  (null, 'presentten', 'Family'::public.action_category, 'Left my phone in another room during dinner.', 'published'::public.moderation_status, true, '2026-10-04T08:30:00.000Z'::timestamptz, '2026-10-04T08:30:00.000Z'::timestamptz),
  (null, 'presentten', 'Health'::public.action_category, 'Sat quietly for ten minutes instead of filling the gap with a screen.', 'published'::public.moderation_status, true, '2026-10-04T07:23:00.000Z'::timestamptz, '2026-10-04T07:23:00.000Z'::timestamptz),
  (null, 'smallcourage', 'Relationships'::public.action_category, 'Said what I actually needed instead of hoping someone would guess.', 'published'::public.moderation_status, true, '2026-10-04T06:16:00.000Z'::timestamptz, '2026-10-04T06:16:00.000Z'::timestamptz),
  (null, 'smallcourage', 'Work'::public.action_category, 'Asked the question I was afraid would make me look uninformed.', 'published'::public.moderation_status, true, '2026-10-04T05:09:00.000Z'::timestamptz, '2026-10-04T05:09:00.000Z'::timestamptz),
  (null, 'smallcourage', 'Responsibility'::public.action_category, 'Made the appointment I had been avoiding.', 'published'::public.moderation_status, true, '2026-10-04T04:02:00.000Z'::timestamptz, '2026-10-04T04:02:00.000Z'::timestamptz);

insert into public.discoveries
  (user_id, demo_username, discovery_text, moderation_status, is_demo, created_at, moderated_at)
values
  (null, 'steady_steps', 'I noticed that doing the important thing first made the rest of the day feel less reactive.', 'published'::public.moderation_status, true, '2026-10-06T15:40:00.000Z'::timestamptz, '2026-10-06T15:40:00.000Z'::timestamptz),
  (null, 'carefirst', 'Helping someone took less time than I had imagined, but changed the tone of my whole day.', 'published'::public.moderation_status, true, '2026-10-06T12:47:00.000Z'::timestamptz, '2026-10-06T12:47:00.000Z'::timestamptz),
  (null, 'earlywalker', 'Leaving my phone behind made the walk feel longer in a good way.', 'published'::public.moderation_status, true, '2026-10-06T09:54:00.000Z'::timestamptz, '2026-10-06T09:54:00.000Z'::timestamptz),
  (null, 'makingroom', 'Protecting time required saying no before it required better scheduling.', 'published'::public.moderation_status, true, '2026-10-06T07:01:00.000Z'::timestamptz, '2026-10-06T07:01:00.000Z'::timestamptz),
  (null, 'kindwork', 'The apology became easier once I stopped trying to explain myself.', 'published'::public.moderation_status, true, '2026-10-06T04:08:00.000Z'::timestamptz, '2026-10-06T04:08:00.000Z'::timestamptz),
  (null, 'learnonpurpose', 'I learn faster when I write down exactly what I do not understand.', 'published'::public.moderation_status, true, '2026-10-06T01:15:00.000Z'::timestamptz, '2026-10-06T01:15:00.000Z'::timestamptz),
  (null, 'homefirst', 'Being physically present is not the same as giving someone my attention.', 'published'::public.moderation_status, true, '2026-10-05T22:22:00.000Z'::timestamptz, '2026-10-05T22:22:00.000Z'::timestamptz),
  (null, 'creativehour', 'Making something without planning to share it changed how freely I worked.', 'published'::public.moderation_status, true, '2026-10-05T19:29:00.000Z'::timestamptz, '2026-10-05T19:29:00.000Z'::timestamptz),
  (null, 'servequietly', 'Useful actions often go unnoticed, and that did not make them less meaningful.', 'published'::public.moderation_status, true, '2026-10-05T16:36:00.000Z'::timestamptz, '2026-10-05T16:36:00.000Z'::timestamptz),
  (null, 'honestpause', 'A short pause prevented me from turning a disagreement into something larger.', 'published'::public.moderation_status, true, '2026-10-05T13:43:00.000Z'::timestamptz, '2026-10-05T13:43:00.000Z'::timestamptz),
  (null, 'keepfaith', 'The quiet time mattered most on the morning when I felt I had no time for it.', 'published'::public.moderation_status, true, '2026-10-05T10:50:00.000Z'::timestamptz, '2026-10-05T10:50:00.000Z'::timestamptz),
  (null, 'showupdaily', 'Keeping a small commitment strengthened my confidence more than making a new plan.', 'published'::public.moderation_status, true, '2026-10-05T07:57:00.000Z'::timestamptz, '2026-10-05T07:57:00.000Z'::timestamptz),
  (null, 'lessbutbetter', 'Removing one obligation gave me more energy than optimizing five others.', 'published'::public.moderation_status, true, '2026-10-05T05:04:00.000Z'::timestamptz, '2026-10-05T05:04:00.000Z'::timestamptz),
  (null, 'presentten', 'Ten undistracted minutes felt more substantial than an hour of partial attention.', 'published'::public.moderation_status, true, '2026-10-05T02:11:00.000Z'::timestamptz, '2026-10-05T02:11:00.000Z'::timestamptz),
  (null, 'smallcourage', 'The thing I was avoiding became manageable as soon as I took the first concrete step.', 'published'::public.moderation_status, true, '2026-10-04T23:18:00.000Z'::timestamptz, '2026-10-04T23:18:00.000Z'::timestamptz);
