-module(clusters).
-compile([debug_info]).
-export([superset/1,aggregate/1]).

%равноправие
%1. делаем граф с весом каждого ребра
%2. при нахождении 2-х элементов в 1 кластере увеличиваем вес ребра на 1
%3. выводим сортиованый по убыванию весов список всех связей
%4. выводим по убыванию весов связей список людей для каждого

%звенья:
%считаем кол-во попаданий только для командиров
%выводим список для звеньевых

% if {A,B,Count} -> {A,B,Count+1}
%{A,B} -> {A,B,1}
% not_found -> {A,B,1}

aggregate(A)->update_filter(A,[]).
superset(A)->superset(A,[]).

update_filter([],Acc)->
    Acc;
update_filter([H|T],Acc) ->
    {A,B}=H,
    {Match,Unmatch}=lists:partition(fun(X)->X=:={A,B} orelse X=:={B,A} end,[H|T]),
    update_filter(Unmatch,[{{A,B},length(Match)}|Acc]).

superset([],Acc)->Acc;
superset([H|T],Acc)->
    superset(T,Acc++set_to_pairs(H)).

%разбираем на пары список
set_to_pairs([H|T])->set_to_pairs([H|T],[]).
set_to_pairs([_|[]],Result)->
    Result;
set_to_pairs([H|T],Result)->
    set_to_pairs(T,make_pairs(H,T)++Result).

%составляем пары элемента с хвостом
make_pairs(A,B)->
    make_pairs(A,B,[]).
make_pairs(_,[],Acc)->
    Acc;
make_pairs(A,[H|T],Acc)->
    make_pairs(A,T,[{A,H}|Acc]).


