--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: trades; Type: TABLE; Schema: public; Owner: choobs
--

CREATE TABLE public.trades (
    trade_id integer NOT NULL,
    user_id integer NOT NULL,
    trade_account character varying(50) NOT NULL,
    symbol character varying(20) NOT NULL,
    side character varying(10),
    time_of_first_entry timestamp without time zone NOT NULL,
    avg_entry_price numeric(12,4) NOT NULL,
    total_entry_stock_amount integer NOT NULL,
    time_of_last_exit timestamp without time zone NOT NULL,
    avg_exit_price numeric(12,4) NOT NULL,
    total_exit_stock_amount integer NOT NULL,
    total_buy numeric(12,2) NOT NULL,
    total_sell numeric(12,2) NOT NULL,
    pnl numeric(12,2) NOT NULL,
    outcome character varying(10),
    num_entries integer DEFAULT 0 NOT NULL,
    num_exits integer DEFAULT 0 NOT NULL,
    stop_loss numeric(12,4),
    price_target numeric(12,4),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT trades_outcome_check CHECK (((outcome)::text = ANY ((ARRAY['Profit'::character varying, 'Loss'::character varying])::text[]))),
    CONSTRAINT trades_side_check CHECK (((side)::text = ANY ((ARRAY['Buy'::character varying, 'Sell'::character varying])::text[])))
);


ALTER TABLE public.trades OWNER TO choobs;

--
-- Name: trades_trade_id_seq; Type: SEQUENCE; Schema: public; Owner: choobs
--

CREATE SEQUENCE public.trades_trade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.trades_trade_id_seq OWNER TO choobs;

--
-- Name: trades_trade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: choobs
--

ALTER SEQUENCE public.trades_trade_id_seq OWNED BY public.trades.trade_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: choobs
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO choobs;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: choobs
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO choobs;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: choobs
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: trades trade_id; Type: DEFAULT; Schema: public; Owner: choobs
--

ALTER TABLE ONLY public.trades ALTER COLUMN trade_id SET DEFAULT nextval('public.trades_trade_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: choobs
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: choobs
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (trade_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: choobs
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: choobs
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: trades trades_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: choobs
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

