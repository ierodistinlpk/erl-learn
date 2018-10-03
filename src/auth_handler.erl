%% Feel free to use, reuse and abuse the code in this file.
%% TODO
% return session id
% keep session id in database
% POST authorization
%% @doc Handler with basic HTTP authorization.
-module(auth_handler).
-behaviour(cowboy_http_handler).
-export([init/3]).
-export([handle/2]).
-export([terminate/3]).

init(_Transport, Req, []) ->
	{ok, Req, undefined_state}.

handle(Req, State) ->
    {Method_name,_ }= cowboy_req:method(Req),
    {Succes,Req1,_}=process_auth(Method_name,Req,State),
    case Succes of 
	{true,Username,Ses_id}->
	    Data=[{logged_in,true},{username,Username}],
	    Req2 = cowboy_req:set_resp_cookie(<<"ssid">>,Ses_id,[{max_age, 3600}],Req1),
	    {ok, ReqN} = cowboy_req:reply(200, [{<<"content-type">>, <<"application/json">>}], jiffy:encode({Data}), Req2);
	{false,Reason}->
	    Data=[{logged_in,false},{msg,Reason}],
	    {ok, ReqN} = cowboy_req:reply(200, [{<<"content-type">>, <<"application/json">>}], jiffy:encode({Data}), Req1)
    end,
    {ok, ReqN, State}.

process_auth(<<"GET">>,Req,State)->
    Parse_res = cowboy_req:parse_header(<<"authorization">>,Req),
    case Parse_res of 
	{ok, Auth, Req1} ->
	    case Auth of
		{<<"basic">>, {Username,Password}} ->
		    {check_in_db(Username,Password),Req1,State};
		_ ->
		    {{false,<<"no need  auth">>},Req1, State}
	    end;
	_ -> 
	    {{false,<<"no need  auth">>},Req, State}
    end;
process_auth(<<"POST">>,Req,State)->
    {Ses_id,Req1} = cowboy_req:cookie(<<"ssid">>,Req),
    Sid=quest_handler:check_session(Ses_id),
    case Sid of
	false ->
	    {ok,Body,Req2} = cowboy_req:body(Req1),
	    Tmp=binary:split(Body,<<"&">>,[global]),
						%NEED MORE INTELLECTUAL CHECKS!!!!
	    case length(Tmp) of
		2 ->
		    Parse_res=lists:map(fun(X)->[Key,Val]=binary:split(X,<<"=">>), {Key,Val} end,Tmp),
		    [{<<"user">>,Username},{<<"pwd">>,Password}]=Parse_res,
		    {check_in_db(Username,Password),Req2,State};
		_ ->
		    {{false,'not logged in'},Req2,State}
	    end;
     	_ ->
	    Squery="select username, session from users where id = $1",
	    {ok, _ ,[{Username,Ses_id}]}=quest_handler:myquery(Squery,[Sid]),
	    io:fwrite(Ses_id),
	    {{true,Username,Ses_id},Req1,State}
    end.


check_in_db(User,Pass)->
    Host="localhost",
    Opts=[{database,"spaceship"}],
    Exists_query="select username from users where username ILIKE $1",
    Auth_query="select id from users where username= $1 and secret = $2",
    Session_query="select get_session($1)",
    {ok, C} = pgsql:connect(Host, ["spaceship"], ["spaceship"], Opts),
    {ok, _, Usernames}=pgsql:equery(C,Exists_query,[User]),
    case Usernames of 
	[]->
	    {false,nouser};
	_->
	    [{Username}]=Usernames,
	    {ok, _, Authenticated} = pgsql:equery(C,Auth_query,[Username,Pass]),
	    case Authenticated of 
		[{Id}|_]->
		    {ok,_,[{Ses_id}]} = pgsql:equery(C, Session_query,[Id]),
		    {true,Username,Ses_id};
		_ ->
		    {false,pwd}
	    end
    end.

terminate(_Reason, _Req, _State)->ok.

