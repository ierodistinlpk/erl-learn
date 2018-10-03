%% Feel free to use, reuse and abuse the code in this file.
%% @doc Handler with basic HTTP authorization.
% TODO
% remove sesion from database
-module(logout_handler).
-behaviour(cowboy_http_handler).
-export([init/3]).
-export([handle/2]).
-export([terminate/3]).

init(_Transport, Req, []) ->
	{ok, Req, undefined_state}.

handle(Req, State) ->
    {Ses_id,Req1} = cowboy_req:cookie(<<"ssid">>,Req),
    update_db(Ses_id),
    Data=[{logged_in,false},{reason,exit}],
    Req2 = cowboy_req:set_resp_cookie(<<"ssid">>,<<>>,[{max_age, 0}],Req1),
    {ok, ReqN} = cowboy_req:reply(200, [{<<"content-type">>, <<"application/json">>}], jiffy:encode({Data}), Req2),
    {ok, ReqN, State}.


update_db(Ses_id)->
    Host="localhost",
    Opts=[{database,"spaceship"}],
    Squery="update users set session = null  where session = $1",
    {ok, C} = pgsql:connect(Host, ["spaceship"], ["spaceship"], Opts),
    {ok, Count}=pgsql:equery(C,Squery,[Ses_id]),
    Count.


terminate(_Reason, _Req, _State)->ok.

