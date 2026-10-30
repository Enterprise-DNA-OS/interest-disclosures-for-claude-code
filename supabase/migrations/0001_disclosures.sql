create table people (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null check(length(trim(name))>0),
 department text not null default '', active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table campaigns (
 id uuid primary key default gen_random_uuid(), code text not null unique, title text not null, due_on date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table requests (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references campaigns(id), person_id uuid not null references people(id),
 response text not null default 'pending' check(response in ('pending','nil','disclosed')), evidence text not null default '', responded_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(campaign_id,person_id)
);
create table disclosures (
 id uuid primary key default gen_random_uuid(), code text not null unique, person_id uuid not null references people(id), request_id uuid references requests(id),
 title text not null check(length(trim(title))>0), kind text not null check(kind in ('financial','relationship','outside-role','gift','other')),
 entity text not null default '', details text not null, declared_on date not null, review_due_on date not null,
 retention_review_on date, revision integer not null default 1 check(revision>0), archived boolean not null default false,
 source_system text not null default '', source_id text, source_data jsonb not null default '{}', source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(source_system,source_id)
);
create table reviews (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique,
 disclosure_id uuid not null references disclosures(id), revision integer not null, reviewer_id uuid not null references people(id),
 outcome text not null check(outcome in ('no-conflict','manage','escalate')), rationale text not null check(length(trim(rationale))>0),
 evidence text not null check(length(trim(evidence))>0), plan text not null default '', monitor_id uuid references people(id), next_review_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(outcome<>'manage' or (length(trim(plan))>0 and monitor_id is not null and next_review_on is not null))
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique, disclosure_id uuid not null references disclosures(id),
 review_id uuid not null references reviews(id), owner_id uuid not null references people(id), title text not null, due_on date not null,
 status text not null default 'open' check(status in ('open','done')), evidence text not null default '', completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'done' or (length(trim(evidence))>0 and completed_at is not null))
);
create table activity (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique, entity text not null, record_id uuid,
 actor text not null check(length(trim(actor))>0), action text not null, note text not null default '', before_data jsonb, after_data jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index disclosure_person on disclosures(person_id); create index review_disclosure on reviews(disclosure_id,sequence desc);
create index action_disclosure on actions(disclosure_id); create index request_person on requests(person_id);
create function touch_updated() returns trigger language plpgsql as $$begin new.updated_at=clock_timestamp();return new;end$$;
create function disclosure_revision() returns trigger language plpgsql as $$begin
 if (to_jsonb(new)-array['revision','updated_at','source_hash','source_data']) is distinct from (to_jsonb(old)-array['revision','updated_at','source_hash','source_data']) then new.revision=old.revision+1;end if;
 return new;end$$;
create trigger revise before update on disclosures for each row execute function disclosure_revision();
create function validate_review() returns trigger language plpgsql as $$declare d disclosures;begin
 select * into d from disclosures where id=new.disclosure_id for update;
 if d.person_id=new.reviewer_id then raise exception 'Independent reviewer required';end if;
 if d.revision<>new.revision or d.archived then raise exception 'Review must use active current revision';end if;
 return new;end$$;
create trigger review_check before insert on reviews for each row execute function validate_review();
create function validate_action() returns trigger language plpgsql as $$begin
 if not exists(select 1 from reviews where id=new.review_id and disclosure_id=new.disclosure_id) then raise exception 'Action review does not match disclosure';end if; return new;end$$;
create trigger action_check before insert or update on actions for each row execute function validate_action();
do $$declare t text;begin foreach t in array array['people','campaigns','requests','disclosures','reviews','actions','activity'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t); execute format('revoke all on %I from public',t);
end loop;end$$;
create view v_latest_reviews with(security_invoker=true) as select distinct on(disclosure_id) * from reviews order by disclosure_id,sequence desc;
create view v_register with(security_invoker=true) as
 select d.id,d.code,p.name as person,p.department,d.title,d.kind,d.entity,d.revision,d.review_due_on,
 r.revision as reviewed_revision,r.outcome,rv.name as reviewer,r.plan,mo.name as monitor,r.next_review_on,
 (select count(*)::int from actions a where a.disclosure_id=d.id and a.status='open') as open_actions,
 case when r.id is null then 'unreviewed' when r.revision<>d.revision then 'changed-since-review'
 when r.outcome='escalate' then 'escalated' when r.next_review_on<current_date then 'review-overdue'
 when exists(select 1 from actions a where a.disclosure_id=d.id and a.status='open' and a.due_on<current_date) then 'action-overdue'
 when r.outcome='manage' then 'managed' else 'no-conflict-recorded' end as position
 from disclosures d join people p on p.id=d.person_id left join v_latest_reviews r on r.disclosure_id=d.id
 left join people rv on rv.id=r.reviewer_id left join people mo on mo.id=r.monitor_id where not d.archived;
create view v_rounds with(security_invoker=true) as
 select c.code as campaign,c.title,c.due_on,count(q.id)::int as requested,
 count(q.id) filter(where q.response='pending')::int as pending,
 count(q.id) filter(where q.response='nil')::int as nil_returns,count(q.id) filter(where q.response='disclosed')::int as disclosed
 from campaigns c left join requests q on q.campaign_id=c.id group by c.id;
create view v_attention with(security_invoker=true) as
 select d.code,p.name as owner,'review-missing'::text as finding,d.review_due_on as due_on from disclosures d join people p on p.id=d.person_id left join v_latest_reviews r on r.disclosure_id=d.id where not d.archived and r.id is null
 union all select code,person,'review-stale',review_due_on from v_register where position='changed-since-review'
 union all select code,monitor,'monitoring-overdue',next_review_on from v_register where next_review_on<current_date
 union all select a.code,p.name,'action-overdue',a.due_on from actions a join people p on p.id=a.owner_id join disclosures d on d.id=a.disclosure_id where a.status='open' and a.due_on<current_date and not d.archived
 union all select c.code,p.name,'return-overdue',c.due_on from requests q join campaigns c on c.id=q.campaign_id join people p on p.id=q.person_id where q.response='pending' and c.due_on<current_date
 union all select d.code,p.name,'retention-review',d.retention_review_on from disclosures d join people p on p.id=d.person_id where d.retention_review_on is null or d.retention_review_on<current_date;
revoke all on v_latest_reviews,v_register,v_rounds,v_attention from public;
