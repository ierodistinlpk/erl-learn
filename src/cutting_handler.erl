-module(cutting_handler).
-export([init/3]).
-export([handle/2]).
-export([terminate/3]).


init(_Transport, Req, []) ->
	{ok, Req, undefined_state}.


% strings type^
handle(Req,State)->
    {List,Req1}=cowboy_req:qs_val(<<"to_saw">>,Req),    
    io:write(prepare(intarize(jsx:decode(List)))),
    io:format("~s",["\n"]),
    Sawed=cutting:placing(prepare(intarize(jsx:decode(List)))),
    Data=#{sawed=>Sawed,total_rem=>cutting:remainder_sum(Sawed)},
    {ok, Req3} = cowboy_req:reply(200, [{<<"content-type">>, <<"application/json">>}], jsx:encode(Data), Req1),
    {ok, Req3, State}.

terminate(_Reason, _Req, _State)->ok.

intarize([]) -> [];
intarize([<<>>]) -> [0,0];
intarize([H|T]) -> lists:map(fun(A)->intarize(A) end,[H|T]);
intarize(A) -> list_to_integer(binary_to_list(A)).
    

prepare(List) ->
    prepare(List,[]).

prepare([],Acc)->
    Acc;
prepare([Head|Tail],Acc)->
    [Len,Count]=Head,
    prepare(Tail,[{Len,Count}|Acc]).
