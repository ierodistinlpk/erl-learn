-module(persongraph_handler).
-export([init/3,handle/2,terminate/3,prepare/1]).


init(_Type, Req, []) ->
    {ok, Req, no_state}.

handle(Req, State) ->
    List=[[<<"Unit1">>,<<"Unit2">>,<<"Unit3">>,<<"Unit4">>,<<"Unit5">>],
[<<"Unit6">>,<<"Unit7">>,<<"Unit8">>,<<"Unit9">>,<<"Unit10">>],
[<<"Unit11">>,<<"Unit12">>,<<"Unit13">>,<<"Unit14">>,<<"Unit15">>],
[<<"unit16">>,<<"unit17">>,<<"unit18">>,<<"unit19">>,<<"unit20">>],
[<<"unit21">>,<<"unit22">>,<<"unit23">>,<<"unit24">>,<<"unit25">>],
[<<"Unit1">>,<<"unit22">>,<<"Unit3">>,<<"Unit14">>,<<"Unit5">>],
[<<"unit16">>,<<"unit24">>,<<"Unit12">>,<<"unit19">>],
[<<"Unit6">>,<<"Unit8">>,<<"Unit15">>,<<"unit23">>,<<"Unit4">>],
[<<"unit17">>,<<"unit25">>,<<"unit18">>,<<"unit21">>],
[<<"Unit7">>,<<"Unit11">>,<<"Unit13">>,<<"Unit1">>],
[<<"Unit6">>,<<"unit22">>,<<"unit18">>,<<"Unit10">>,<<"unit23">>],
[<<"Unit1">>,<<"Unit3">>,<<"Unit14">>,<<"Unit5">>,<<"Unit2">>],
[<<"unit16">>,<<"unit21">>,<<"Unit12">>,<<"unit19">>,<<"unit20">>],
[<<"unit17">>,<<"Unit8">>,<<"Unit15">>,<<"unit24">>,<<"Unit4">>],
[<<"Unit7">>,<<"Unit11">>,<<"Unit13">>,<<"unit25">>,<<"Unit9">>],
[<<"unit16">>,<<"unit21">>,<<"unit24">>,<<"unit20">>,<<"unit19">>],
[<<"Unit6">>,<<"unit22">>,<<"unit18">>,<<"Unit10">>,<<"Unit4">>],
[<<"unit17">>,<<"Unit8">>,<<"Unit15">>,<<"unit25">>,<<"Unit9">>],
[<<"Unit7">>,<<"Unit12">>,<<"Unit13">>,<<"Unit14">>,<<"unit23">>],
[<<"Unit1">>,<<"Unit11">>,<<"Unit3">>,<<"Unit2">>,<<"Unit5">>],
[<<"unit16">>,<<"unit17">>,<<"unit21">>,<<"unit24">>,<<"Unit3">>],
[<<"Unit11">>,<<"Unit7">>,<<"Unit1">>,<<"unit23">>,<<"Unit9">>],
[<<"Unit13">>,<<"Unit12">>,<<"Unit4">>,<<"Unit8">>,<<"Unit15">>],
[<<"Unit14">>,<<"Unit1">>,<<"unit18">>,<<"Unit5">>,<<"unit25">>],
[<<"Unit6">>,<<"unit19">>,<<"Unit10">>,<<"unit20">>,<<"unit22">>]],
    Req2 = cowboy_req:reply(200, [
        {<<"content-type">>, <<"application/json">>}
    ], jiffy:encode({[{<<"data">>,prepare(clusters:aggregate(clusters:superset(List)))}]}), Req),
    {ok, Req2, State}.

terminate(_Reason, _, _State) ->
    ok.

prepare(A)->prepare(A,[]).
prepare([],Acc)->Acc;
prepare([H|T],Acc)->
    {{A,B},Count}=H,
	prepare(T,[ {[{<<"names">>,[A,B]},{<<"count">>,Count}]} |Acc]).

