
-- Schema for TCO PDFs application

-- Enable Row Level Security
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

-- Create a table to store TCO metadata
create table if not exists public.tco_pdfs (
  id uuid default uuid_generate_v4() primary key,
  tcoNumber text not null,
  natureza text not null,
  policiais jsonb,
  pdfPath text not null,
  pdfUrl text not null,
  createdBy uuid references auth.users(id),
  createdAt timestamp with time zone default now() not null
);

-- Enable RLS on the tco_pdfs table
alter table public.tco_pdfs enable row level security;

-- Policies for storage buckets
create policy "Allow authenticated users to create buckets"
  on storage.buckets for insert to authenticated
  with check (true);

create policy "Allow public read access to tco-pdfs bucket"
  on storage.buckets for select to anon
  using (name = 'tco-pdfs');

-- Policies for storage objects
create policy "Allow authenticated users to upload objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'tco-pdfs');

create policy "Allow authenticated users to delete their storage objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'tco-pdfs');

create policy "Allow public read access to tco-pdfs objects"
  on storage.objects for select to anon
  using (bucket_id = 'tco-pdfs');

create policy "Allow authenticated users to update their own objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'tco-pdfs' and auth.uid() = owner)
  with check (bucket_id = 'tco-pdfs' and auth.uid() = owner);

-- Policies for tco_pdfs table
create policy "Allow authenticated users to view their own TCOs"
  on public.tco_pdfs for select to authenticated
  using (createdBy = auth.uid());

create policy "Allow authenticated users to create TCOs"
  on public.tco_pdfs for insert to authenticated
  with check (true);

-- Add policy to allow users to delete their own TCO records
create policy "Allow authenticated users to delete their own TCOs"
  on public.tco_pdfs for delete to authenticated
  using (createdBy = auth.uid());

-- Create public functions
create or replace function public.get_all_tcos()
returns setof public.tco_pdfs
language sql
security definer
as $$
  select * from public.tco_pdfs order by "createdAt" desc;
$$;

-- Add RLS policy to allow access to the function
create policy "Allow authenticated users to access all TCOs"
  on public.tco_pdfs for select to authenticated
  using (true);

-- Improved trigger to properly manage file metadata and storage deletion
create or replace function handle_storage_update()
returns trigger
language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    -- Extract bucket ID and path from pdfPath (assuming format follows standard 'bucket/path')
    -- No need to extract bucket ID since we know it's 'tco-pdfs'
    -- Attempt to delete the associated file using proper error handling
    begin
      perform storage.delete('tco-pdfs', old.pdfPath);
    exception when others then
      -- Log error but continue with deletion of the record
      raise notice 'Error deleting file from storage: %', SQLERRM;
    end;
    return old;
  end if;
  return new;
end
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_tco_delete on public.tco_pdfs;

-- Create the trigger to automatically delete files when TCO records are deleted
create trigger on_tco_delete
  after delete on public.tco_pdfs
  for each row execute procedure handle_storage_update();
