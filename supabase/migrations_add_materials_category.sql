-- Allow "materials" as an expense category.
alter table expenses drop constraint if exists expenses_category_check;
alter table expenses add constraint expenses_category_check
  check (category in ('supplier','install','misc','materials'));
