-module(device_handler).
-behaviour(cowboy_http_handler).
-export([init/3]).
-export([handle/2]).
-export([terminate/3]).


init(_Transport, Req, []) ->
    {ok, Req, undefined_state}.


handle(Req,State)->

    Data=[{switches,[[{name,<<"11">>},{node,<<"1">>}]]},{nodes,[[{name,<<"1">>},{x,30},{y,40}],[{name,<<"2">>},{x,130},{y,140}]]}],

%  switches= dbexec{|dbh|dbh.execute(swquery)}.fetch_all.map{|row| {'name'=>row[0],'node'=>row[1],'type'=>row[2],'adr'=>row[3]} }
%  nodes= dbexec{|dbh|dbh.execute(nodequery)}.fetch_all.map{|row| {'name'=>row[0],'x'=>row[1],'y'=>row[2],'adr'=>row[3],'key'=>row[4]} }

    {ok, ReqM} = cowboy_req:reply(200, [{<<"content-type">>, <<"application/json">>}], jsx:encode(Data), Req),
    {ok, ReqM, State}.



terminate(_Reason, _Req, _State)->ok.
