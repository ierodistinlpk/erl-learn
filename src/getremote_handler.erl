-module(getremote_handler).
-behaviour(cowboy_http_handler).

%% Cowboy_http_handler callbacks
-export([
    init/3,
    handle/2,
    terminate/3
]).

init({tcp, http}, Req, _Opts) ->
    {ok, Req, undefined_state}.

handle(Req, State) ->
   % Body = <<"<h1>getremote</h1>">>,
    inets:start(),
    %User_info_str="http://topori.ucoz.ru/index/8-71",
    %{Ret,Resp}=httpc:request("http://topori.lipetsk.ru/index.html"),
    %{Username, Req2} = cowboy_req:qs_val(<<"uid">>, Req, "stranger"),
    {Ret,Resp}=httpc:request("http://topori.ucoz.ru/api/forum/0-0-1-35"),
    Body=getBody(Ret,Resp),
    inets:stop(),    
    {ok, Req2} = cowboy_req:reply(200, [], Body, Req),
    {ok, Req2, State}.

getBody(ok,Resp)->
    {Hdr,Atr,Content}=Resp,
    Content;
getBody(error,Resp)->
    {Hdr,Val}=Resp,
    io_lib:format("~p",[Val]);
getBody(_,Resp)->io_lib:format("~p",[Resp]).

terminate(_Reason, _Req, _State) ->
    ok.

