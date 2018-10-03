% -*- encoding:utf-8 -*-
-module (cutting).
-export ([placing/1,remainder_sum/1]).
%Block_size
%needs list: [{length:Count},...]
%bar strucrure: {parts:[<num>...],remainder:Remainder}
%when all arts assigned - comparing all with minium remainder and swapping. after each swap - sort by remainder and repeat.

placing(List)->placing(lists:reverse(lists:sort(List)),[]).
%Placing(List,Status) # find possible  continuation for current desk
placing([],Status) -> Status;
 
placing([{_,0}|Tail],Status) ->
    placing(Tail,Status);

placing([{Len,Count}|Tail],Status) ->
    placing([{Len,Count-1}|Tail],add_part(Len,Status)).

remainder_sum(List)->
    lists:foldl(fun(#{parts:=_,remainder:=Rem},S)->S+Rem end,0,List).
    
add_part(Len,Status)->
    Bar_len=600,
    add_part(Len,Status,Bar_len,[]).

add_part(Len,[],Bar_len,Acc)  ->
	[new_bar(Len,Bar_len)|Acc];

% find bar with minimal remainder, but GE than Len
% try to insert, if rem i s too short, try next.

add_part(Len,[H|T],Bar_len,Acc)  ->
    #{parts:=_Parts,remainder:=Remainder}=H,
    case Len > Remainder of
	true ->
	    add_part(Len,T,Bar_len,[H|Acc]); 
	false ->
	    lists:sort(fun(A,B)->min_rem(A,B) end,Acc++[add_to_bar(Len,H)]++T)
    end.

new_bar(Len,Bar_len) when Len =< Bar_len ->
  #{parts=>[Len],remainder=>Bar_len-Len}.

add_to_bar(Len,#{parts:=Parts,remainder:=Remainder}) when Len=<Remainder ->
 #{parts=>[Len|Parts],remainder=>Remainder-Len}.

%optimize_chunks(#{parts:=Chunks1,remainder:=Rem1},#{parts:=Chunks2,remainder:=Rem2})->
% compare remainders. let rem(bar1)>rem(bar2)
% try find chunk from bar1 with size max between  smallest bar2 chunk and bar2 chunk +rem(bar2)
% for each Chunk1 in bar1 do
% Possible = max(lists:filter(fun(Chunk) Chunk1 =<Chunk =< Chunk1+Rem1 end,Chunks2))
% Changed = Chunk1
%Bar1,Bar2.
	
min_rem(#{parts:=_,remainder:=RemA},#{parts:=_,remainder:=RemB}) when RemA=<RemB->true;
min_rem(#{parts:=_,remainder:=RemA},#{parts:=_,remainder:=RemB}) when RemA>RemB->false.

