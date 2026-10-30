insert into people(code,name,department) values ('P01','Mara West','Procurement'),('P02','Leo Reed','Operations'),('P03','Aroha Lane','Governance'),('P04','Nina Cole','Finance'),('P05','Samir Vale','Governance') on conflict do nothing;
insert into campaigns(code,title,due_on) values ('ROUND-01','Annual interests declaration',current_date-7),('ROUND-02','Tender panel refresh',current_date+14) on conflict do nothing;
insert into requests(campaign_id,person_id) select c.id,p.id from campaigns c cross join people p on conflict do nothing;
insert into disclosures(code,person_id,request_id,title,kind,entity,details,declared_on,review_due_on,retention_review_on)
 select 'COI-101',p.id,q.id,'Supplier family connection','relationship','Harbour Supplies','Sibling holds a management role at a tendering supplier.',current_date-30,current_date-20,current_date+300 from people p join requests q on q.person_id=p.id join campaigns c on c.id=q.campaign_id where p.code='P01' and c.code='ROUND-01' on conflict do nothing;
insert into disclosures(code,person_id,title,kind,entity,details,declared_on,review_due_on,retention_review_on)
 select 'COI-102',id,'Outside advisory role','outside-role','Northern Trust','Advisory role declared. Scope to be assessed.',current_date-15,current_date-3,current_date-1 from people where code='P02' on conflict do nothing;
insert into disclosures(code,person_id,title,kind,entity,details,declared_on,review_due_on,retention_review_on)
 select 'COI-103',id,'Supplier hospitality invitation','gift','Harbour Supplies','Invitation recorded for independent assessment.',current_date-10,current_date-2,current_date+200 from people where code='P04' on conflict do nothing;
insert into reviews(disclosure_id,revision,reviewer_id,outcome,rationale,evidence,plan,monitor_id,next_review_on)
 select d.id,d.revision,p.id,'manage','Separate the employee from the tender evaluation.','Fictional committee minutes DEMO-01','Recuse from scoring and supplier communications.',p.id,current_date-2 from disclosures d cross join people p where d.code='COI-101' and p.code='P03' and not exists(select 1 from reviews where disclosure_id=d.id);
insert into reviews(disclosure_id,revision,reviewer_id,outcome,rationale,evidence,next_review_on)
 select d.id,d.revision,p.id,'no-conflict','Invitation declined in the supplied record.','Fictional response DEMO-02',current_date+60 from disclosures d cross join people p where d.code='COI-103' and p.code='P03' and not exists(select 1 from reviews where disclosure_id=d.id);
update disclosures set details='Invitation now includes a guest. Earlier review needs checking.' where code='COI-103' and revision=1;
insert into actions(code,disclosure_id,review_id,owner_id,title,due_on)
 select 'ACT-101',d.id,r.id,p.id,'Confirm recusal in tender minutes',current_date-4 from disclosures d join v_latest_reviews r on r.disclosure_id=d.id cross join people p where d.code='COI-101' and p.code='P05' on conflict do nothing;
update requests set response='disclosed',evidence='Fictional seed disclosure',responded_at=now() where id in(select request_id from disclosures where request_id is not null) and response='pending';
