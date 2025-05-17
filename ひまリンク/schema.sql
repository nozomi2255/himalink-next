

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 現在のユーザーIDを取得
    v_user_id := auth.uid();
    
    -- ユーザーIDがない場合はエラー
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'ユーザーが認証されていません';
    END IF;

    -- リアクションが既に存在するか確認
    IF EXISTS (
        SELECT 1 
        FROM "EntryReactions" 
        WHERE entry_id = p_entry_id 
        AND user_id = v_user_id 
        AND reaction_type = p_reaction_type
    ) THEN
        -- 既に存在する場合は何もしない
        RETURN;
    END IF;
    
    -- リアクションを追加
    INSERT INTO "EntryReactions" (
        entry_id,
        user_id,
        reaction_type,
        created_at
    ) VALUES (
        p_entry_id,
        v_user_id,
        p_reaction_type,
        NOW()
    );
END;
$$;


ALTER FUNCTION "public"."add_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."memos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "pinned" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."memos" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_memo"("p_user_id" "uuid", "p_user_name" "text", "p_title" "text", "p_body" "text") RETURNS "public"."memos"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_memo memos;
BEGIN
  INSERT INTO memos (user_id, user_name, title, body)
  VALUES (p_user_id, p_user_name, p_title, p_body)
  RETURNING * INTO new_memo;
  
  RETURN new_memo;
END;
$$;


ALTER FUNCTION "public"."create_memo"("p_user_id" "uuid", "p_user_name" "text", "p_title" "text", "p_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_entry"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  delete from "Entries"
  where id = p_id;
end;
$$;


ALTER FUNCTION "public"."delete_entry"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") RETURNS TABLE("deleted_count" integer, "user_id" "uuid", "entry_id" "uuid", "reaction_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
    v_user_id UUID;
    v_deleted_count INTEGER;
BEGIN
    -- 現在のユーザーIDを取得
    v_user_id := auth.uid();
    
    -- ユーザーIDがない場合はエラー
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'ユーザーが認証されていません';
    END IF;
    
    -- リアクションを削除して削除件数を取得
    WITH deleted AS (
        DELETE FROM "EntryReactions" er
        WHERE er.entry_id = p_entry_id
        AND er.user_id = v_user_id
        AND er.reaction_type = p_reaction_type
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;
    
    RAISE NOTICE 'Deleted % reactions', v_deleted_count;
    
    -- 削除結果を返す
    RETURN QUERY
    SELECT 
        v_deleted_count AS deleted_count,
        v_user_id AS user_id,
        p_entry_id AS entry_id,
        p_reaction_type AS reaction_type;
END;$$;


ALTER FUNCTION "public"."delete_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_memo"("_memo_id" "uuid") RETURNS SETOF "public"."memos"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  DELETE FROM public.memos
  WHERE id = _memo_id
  RETURNING *;                  -- ← 行が不要ならこの行を削除
$$;


ALTER FUNCTION "public"."delete_memo"("_memo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_followed_events_grouped"("_follower_id" "uuid") RETURNS TABLE("event_date" "date", "events" "jsonb")
    LANGUAGE "sql"
    AS $$
  SELECT
    -- ▼ユーザーに合わせて「Asia/Tokyo」で丸めた日付
    (E.start_time AT TIME ZONE 'Asia/Tokyo')::date        AS event_date,

    -- ▼当日のイベントを JSON 配列にまとめる
    jsonb_agg(
      jsonb_build_object(
        'event_id',   E.id,
        'user_id',    E.user_id,
        'username',   U.username,
        'title',      E.title,
        'content',    E.content,
        'entry_type', E.entry_type,
        'start_time', E.start_time,
        'end_time',   E.end_time,
        'is_all_day', E.is_all_day,
        'location',   E.location,
        'updated_at', E.updated_at,
        'avatar_url', U.avatar_url
      )
      ORDER BY E.start_time
    )                                                    AS events
  FROM public."Entries"  E
  JOIN public."Users"    U ON U.id = E.user_id
  WHERE E.visibility = 'public'
    AND (
      -- 自分のイベント
      E.user_id = _follower_id
      -- or フォロー中ユーザーのイベント
      OR E.user_id IN (
        SELECT following_id
        FROM public."Follows"
        WHERE follower_id = _follower_id
      )
    )
  GROUP BY event_date
  ORDER BY event_date DESC;      -- 新しい日付 → 古い日付
$$;


ALTER FUNCTION "public"."get_all_followed_events_grouped"("_follower_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_entries_by_user_id"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" "text", "start_time" timestamp with time zone, "end_time" timestamp with time zone, "is_all_day" boolean, "entry_type" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select * from "Entries"
  where "user_id" = get_entries_by_user_id.user_id;
end;
$$;


ALTER FUNCTION "public"."get_entries_by_user_id"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_entry_comments"("p_entry_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "comment" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql"
    AS $$
  select
    c.id,
    c.user_id,
    c.comment,
    c.created_at
  from public."EntryComments" c
  where c.entry_id = p_entry_id
  order by c.created_at asc;
$$;


ALTER FUNCTION "public"."get_entry_comments"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_entry_reaction_users"("p_entry_id" "uuid") RETURNS TABLE("reaction_id" "uuid", "entry_id" "uuid", "user_id" "uuid", "username" "text", "avatar_url" "text", "reaction_type" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql"
    AS $$
  select 
    er.id as reaction_id,
    er.entry_id,
    er.user_id,
    u.username,
    u.avatar_url,
    er.reaction_type,
    er.created_at
  from 
    "EntryReactions" er
  join 
    "Users" u on er.user_id = u.id
  where 
    er.entry_id = p_entry_id
  order by 
    er.created_at desc;
$$;


ALTER FUNCTION "public"."get_entry_reaction_users"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_entry_reactions_summary"("p_entry_id" "uuid") RETURNS TABLE("reaction_type" "text", "count" bigint)
    LANGUAGE "sql"
    AS $$
  select 
    er.reaction_type, 
    count(*) as count
  from "EntryReactions" er
  where er.entry_id = p_entry_id
  group by er.reaction_type
  order by count desc;
$$;


ALTER FUNCTION "public"."get_entry_reactions_summary"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_entry_with_details"("p_entry_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" character varying, "content" "text", "start_time" timestamp with time zone, "end_time" timestamp with time zone, "location" character varying, "is_all_day" boolean)
    LANGUAGE "sql"
    AS $$
  select
    e.id,
    e.user_id,
    e.title,
    e.content,
    e.start_time,
    e.end_time,
    e.location,
    e.is_all_day
  from public."Entries" e
  where e.id = p_entry_id;
$$;


ALTER FUNCTION "public"."get_entry_with_details"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_following_ids"("follower_id" "uuid") RETURNS TABLE("following_id" "uuid")
    LANGUAGE "sql" STABLE
    AS $$
  select f.following_id
  from "Follows" f
  where f.follower_id = get_following_ids.follower_id;
$$;


ALTER FUNCTION "public"."get_following_ids"("follower_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_memos"() RETURNS SETOF "public"."memos"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM memos
  ORDER BY pinned DESC, updated_at DESC;
$$;


ALTER FUNCTION "public"."get_memos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_followed_events"("_follower_id" "uuid") RETURNS TABLE("event_id" "uuid", "user_id" "uuid", "username" character varying, "title" character varying, "content" "text", "entry_type" character varying, "start_time" timestamp with time zone, "end_time" timestamp with time zone, "is_all_day" boolean, "location" character varying, "updated_at" timestamp with time zone, "avatar_url" character varying, "time_since_update" interval)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    E.id              AS event_id,
    E.user_id,
    U.username,                          -- ★ 追加
    E.title,
    E.content,
    E.entry_type,
    E.start_time,
    E.end_time,
    E.is_all_day,
    E.location,
    E.updated_at,
    U.avatar_url,
    (now() AT TIME ZONE 'utc' - E.updated_at) AS time_since_update
  FROM public."Entries"  E
  JOIN public."Users"    U ON E.user_id = U.id
  WHERE E.updated_at >= (now() AT TIME ZONE 'utc') - INTERVAL '24 hours'
    AND E.visibility = 'public'
    AND (
      E.user_id = _follower_id
      OR E.user_id IN (
        SELECT following_id
        FROM public."Follows"
        WHERE follower_id = _follower_id
      )
    )
  ORDER BY E.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_recent_followed_events"("_follower_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_avatar"("user_id" "uuid") RETURNS TABLE("avatar_url" "text", "username" "text")
    LANGUAGE "sql"
    AS $$
  select avatar_url, username
  from "Users"
  where id = user_id;
$$;


ALTER FUNCTION "public"."get_user_avatar"("user_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_type" character varying NOT NULL,
    "title" character varying DEFAULT 'no title'::character varying NOT NULL,
    "content" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "is_all_day" boolean NOT NULL,
    "location" character varying,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "visibility" character varying DEFAULT 'public'::character varying NOT NULL
);


ALTER TABLE "public"."Entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."Entries" IS 'ユーザーがカレンダー上に追加する予定や日記のエントリを管理します。';



CREATE OR REPLACE FUNCTION "public"."get_user_events"("_user_id" "uuid") RETURNS SETOF "public"."Entries"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM public."Entries"
    WHERE user_id = _user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_events"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profile_by_id"("target_user_id" "uuid") RETURNS TABLE("username" "text", "avatar_url" "text", "bio" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select
    u.username,
    u.avatar_url,
    u.bio
  from public."Users" u
  where u.id = target_user_id;
$$;


ALTER FUNCTION "public"."get_user_profile_by_id"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") RETURNS TABLE("id" "uuid", "entry_id" "uuid", "user_id" "uuid", "reaction_type" character varying, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'ユーザーが認証されていません';
  end if;

  return query
  select er.id, er.entry_id, er.user_id, er.reaction_type, er.created_at
  from "EntryReactions" er
  where er.entry_id = p_entry_id
    and er.user_id = v_user_id
    and er.reaction_type = p_reaction_type;
end;
$$;


ALTER FUNCTION "public"."get_user_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_entry"("p_user_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean, "p_entry_type" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into "Entries" (
    user_id, title, start_time, end_time, is_all_day, entry_type, created_at, updated_at
  )
  values (
    p_user_id, p_title, p_start_time, p_end_time, p_is_all_day, p_entry_type, now(), now()
  );
end;
$$;


ALTER FUNCTION "public"."insert_entry"("p_user_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean, "p_entry_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_users"("search_query" "text") RETURNS TABLE("id" "uuid", "name" "text", "email" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select u.id, u.username, u.email
  from "Users" u
  where lower(u.username)  like '%' || lower(search_query) || '%'
     or lower(u.email) like '%' || lower(search_query) || '%'
  order by u.username;
$$;


ALTER FUNCTION "public"."search_users"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_title"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.title IS NULL OR LENGTH(TRIM(NEW.title)) = 0 THEN
    NEW.title := 'no title';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_default_title"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- 自分自身はフォロー不可
  if p_follower_id = p_following_id then
    raise exception 'cannot follow yourself';
  end if;

  if exists (
      select 1
      from "Follows"
      where follower_id  = p_follower_id
        and following_id = p_following_id
  ) then
    delete from "Follows"
    where follower_id  = p_follower_id
      and following_id = p_following_id;
  else
    insert into "Follows"(follower_id, following_id)
    values (p_follower_id, p_following_id);
  end if;
end;
$$;


ALTER FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_entry"("p_id" "uuid", "p_title" "text", "p_content" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update "Entries"
  set
    title = p_title,
    content = p_content,
    start_time = p_start_time,
    end_time = p_end_time,
    is_all_day = p_is_all_day,
    updated_at = now()
  where id = p_id;
end;
$$;


ALTER FUNCTION "public"."update_entry"("p_id" "uuid", "p_title" "text", "p_content" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_memo"("_id" "uuid", "_user_name" "text" DEFAULT NULL::"text", "_title" "text" DEFAULT NULL::"text", "_body" "text" DEFAULT NULL::"text", "_pinned" boolean DEFAULT NULL::boolean) RETURNS SETOF "public"."memos"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.memos
  SET
    user_name = COALESCE(_user_name, user_name),
    title     = COALESCE(_title,     title),
    body      = COALESCE(_body,      body),
    pinned    = COALESCE(_pinned,    pinned),
    updated_at = now()
  WHERE id = _id;

  -- 更新後の行を返す
  RETURN QUERY
  SELECT * FROM public.memos WHERE id = _id;
END;
$$;


ALTER FUNCTION "public"."update_memo"("_id" "uuid", "_user_name" "text", "_title" "text", "_body" "text", "_pinned" boolean) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."EntryComments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."EntryComments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."EntryReactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction_type" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."EntryReactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."EntryVisibilityCustomUsers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "visible_to_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."EntryVisibilityCustomUsers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL
);


ALTER TABLE "public"."Follows" OWNER TO "postgres";


COMMENT ON TABLE "public"."Follows" IS 'フォロー、フォロワーの管理';



CREATE TABLE IF NOT EXISTS "public"."UserStatus" (
    "user_id" "uuid" NOT NULL,
    "is_available" boolean DEFAULT false NOT NULL,
    "message" character varying,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."UserStatus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "username" character varying,
    "full_name" character varying,
    "avatar_url" character varying,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "bio" "text"
);


ALTER TABLE "public"."Users" OWNER TO "postgres";


COMMENT ON TABLE "public"."Users" IS 'ユーザーの基本情報を管理するためのテーブル';



ALTER TABLE ONLY "public"."Entries"
    ADD CONSTRAINT "Entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Follows"
    ADD CONSTRAINT "Follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserStatus"
    ADD CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."EntryComments"
    ADD CONSTRAINT "entrycomments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."EntryReactions"
    ADD CONSTRAINT "entryreactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."EntryVisibilityCustomUsers"
    ADD CONSTRAINT "entryvisibilitycustomusers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memos"
    ADD CONSTRAINT "memos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."EntryVisibilityCustomUsers"
    ADD CONSTRAINT "unique_entry_user" UNIQUE ("entry_id", "visible_to_user_id");



ALTER TABLE ONLY "public"."EntryReactions"
    ADD CONSTRAINT "unique_reaction_per_user" UNIQUE ("entry_id", "user_id", "reaction_type");



CREATE INDEX "idx_entry_visibility_entry_id" ON "public"."EntryVisibilityCustomUsers" USING "btree" ("entry_id");



CREATE INDEX "idx_entry_visibility_user_id" ON "public"."EntryVisibilityCustomUsers" USING "btree" ("visible_to_user_id");



CREATE INDEX "idx_follows_follower_following" ON "public"."Follows" USING "btree" ("follower_id", "following_id");



CREATE INDEX "idx_users_email_trgm" ON "public"."Users" USING "gin" ("lower"(("email")::"text") "public"."gin_trgm_ops");



CREATE INDEX "idx_users_name_trgm" ON "public"."Users" USING "gin" ("lower"(("username")::"text") "public"."gin_trgm_ops");



CREATE OR REPLACE TRIGGER "trg_set_default_title" BEFORE INSERT OR UPDATE ON "public"."Entries" FOR EACH ROW EXECUTE FUNCTION "public"."set_default_title"();



ALTER TABLE ONLY "public"."Entries"
    ADD CONSTRAINT "Entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id");



ALTER TABLE ONLY "public"."Follows"
    ADD CONSTRAINT "Follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Follows"
    ADD CONSTRAINT "Follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."EntryComments"
    ADD CONSTRAINT "entrycomments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."Entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."EntryComments"
    ADD CONSTRAINT "entrycomments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."EntryReactions"
    ADD CONSTRAINT "entryreactions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."Entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."EntryReactions"
    ADD CONSTRAINT "entryreactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."EntryVisibilityCustomUsers"
    ADD CONSTRAINT "fk_entry_id" FOREIGN KEY ("entry_id") REFERENCES "public"."Entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."EntryVisibilityCustomUsers"
    ADD CONSTRAINT "fk_visible_to_user_id" FOREIGN KEY ("visible_to_user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memos"
    ADD CONSTRAINT "memos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."UserStatus"
    ADD CONSTRAINT "userstatus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow entry owner to delete visibility settings" ON "public"."EntryVisibilityCustomUsers" FOR DELETE TO "authenticated" USING (("entry_id" IN ( SELECT "Entries"."id"
   FROM "public"."Entries"
  WHERE ("Entries"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow entry owner to insert visibility settings" ON "public"."EntryVisibilityCustomUsers" FOR INSERT TO "authenticated" WITH CHECK (("entry_id" IN ( SELECT "Entries"."id"
   FROM "public"."Entries"
  WHERE ("Entries"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow entry owner to update visibility settings" ON "public"."EntryVisibilityCustomUsers" FOR UPDATE TO "authenticated" USING (("entry_id" IN ( SELECT "Entries"."id"
   FROM "public"."Entries"
  WHERE ("Entries"."user_id" = "auth"."uid"())))) WITH CHECK (("entry_id" IN ( SELECT "Entries"."id"
   FROM "public"."Entries"
  WHERE ("Entries"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow entry owner to view visibility settings" ON "public"."EntryVisibilityCustomUsers" FOR SELECT TO "authenticated" USING (("entry_id" IN ( SELECT "Entries"."id"
   FROM "public"."Entries"
  WHERE ("Entries"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow user to view own visible entries" ON "public"."EntryVisibilityCustomUsers" FOR SELECT TO "authenticated" USING (("visible_to_user_id" = "auth"."uid"()));



CREATE POLICY "Delete for authenticated" ON "public"."Entries" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Delete for authenticated" ON "public"."Follows" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Delete for authenticated" ON "public"."Users" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable Insert access for all users" ON "public"."Users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."Follows" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "following_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."Entries" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."Entries" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."Users" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated" ON "public"."Follows" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."Entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."EntryVisibilityCustomUsers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Insert for authenticated" ON "public"."Follows" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Update for authenticated" ON "public"."Entries" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Update for authenticated" ON "public"."Users" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "delete_own_follows" ON "public"."Follows" FOR DELETE USING (("follower_id" = ("current_setting"('request.jwt.claim.sub'::"text", true))::"uuid"));



CREATE POLICY "insert_own_follows" ON "public"."Follows" FOR INSERT WITH CHECK (("follower_id" = ("current_setting"('request.jwt.claim.sub'::"text", true))::"uuid"));



CREATE POLICY "select_own_follows" ON "public"."Follows" FOR SELECT USING ((("follower_id" = ("current_setting"('request.jwt.claim.sub'::"text", true))::"uuid") OR ("following_id" = ("current_setting"('request.jwt.claim.sub'::"text", true))::"uuid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Follows";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "service_role";



GRANT ALL ON TABLE "public"."memos" TO "anon";
GRANT ALL ON TABLE "public"."memos" TO "authenticated";
GRANT ALL ON TABLE "public"."memos" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_memo"("p_user_id" "uuid", "p_user_name" "text", "p_title" "text", "p_body" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_memo"("p_user_id" "uuid", "p_user_name" "text", "p_title" "text", "p_body" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_memo"("p_user_id" "uuid", "p_user_name" "text", "p_title" "text", "p_body" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_entry"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_entry"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_entry"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_entry_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_memo"("_memo_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_memo"("_memo_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_memo"("_memo_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_followed_events_grouped"("_follower_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_followed_events_grouped"("_follower_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_followed_events_grouped"("_follower_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entries_by_user_id"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entries_by_user_id"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entries_by_user_id"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entry_comments"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entry_comments"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entry_comments"("p_entry_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entry_reaction_users"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entry_reaction_users"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entry_reaction_users"("p_entry_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entry_reactions_summary"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entry_reactions_summary"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entry_reactions_summary"("p_entry_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_entry_with_details"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_entry_with_details"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entry_with_details"("p_entry_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_following_ids"("follower_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_following_ids"("follower_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_following_ids"("follower_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_memos"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_memos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_memos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_followed_events"("_follower_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_followed_events"("_follower_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_followed_events"("_follower_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_avatar"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_avatar"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_avatar"("user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."Entries" TO "anon";
GRANT ALL ON TABLE "public"."Entries" TO "authenticated";
GRANT ALL ON TABLE "public"."Entries" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_events"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_events"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_events"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile_by_id"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile_by_id"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile_by_id"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_reaction"("p_entry_id" "uuid", "p_reaction_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_entry"("p_user_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean, "p_entry_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_entry"("p_user_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean, "p_entry_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_entry"("p_user_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean, "p_entry_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_title"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_title"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_title"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_follow"("p_follower_id" "uuid", "p_following_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_entry"("p_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_entry"("p_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_entry"("p_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_is_all_day" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_memo"("_id" "uuid", "_user_name" "text", "_title" "text", "_body" "text", "_pinned" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_memo"("_id" "uuid", "_user_name" "text", "_title" "text", "_body" "text", "_pinned" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_memo"("_id" "uuid", "_user_name" "text", "_title" "text", "_body" "text", "_pinned" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."EntryComments" TO "anon";
GRANT ALL ON TABLE "public"."EntryComments" TO "authenticated";
GRANT ALL ON TABLE "public"."EntryComments" TO "service_role";



GRANT ALL ON TABLE "public"."EntryReactions" TO "anon";
GRANT ALL ON TABLE "public"."EntryReactions" TO "authenticated";
GRANT ALL ON TABLE "public"."EntryReactions" TO "service_role";



GRANT ALL ON TABLE "public"."EntryVisibilityCustomUsers" TO "anon";
GRANT ALL ON TABLE "public"."EntryVisibilityCustomUsers" TO "authenticated";
GRANT ALL ON TABLE "public"."EntryVisibilityCustomUsers" TO "service_role";



GRANT ALL ON TABLE "public"."Follows" TO "anon";
GRANT ALL ON TABLE "public"."Follows" TO "authenticated";
GRANT ALL ON TABLE "public"."Follows" TO "service_role";



GRANT ALL ON TABLE "public"."UserStatus" TO "anon";
GRANT ALL ON TABLE "public"."UserStatus" TO "authenticated";
GRANT ALL ON TABLE "public"."UserStatus" TO "service_role";



GRANT ALL ON TABLE "public"."Users" TO "anon";
GRANT ALL ON TABLE "public"."Users" TO "authenticated";
GRANT ALL ON TABLE "public"."Users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
