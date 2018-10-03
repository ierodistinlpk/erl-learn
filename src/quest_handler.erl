-module(quest_handler).
-export([init/3]).
-export([handle/2]).
-export([terminate/3]).
-export([mymap/2]).
-export([myquery/2]).
-export([select_data/2]).
-export([prepare_data/1]).
-export([get_status/0]).
-export([get_ship/3]).
-export([get_problem/3]).
-export([check_session/1]).


init(_Transport, Req, []) ->
	{ok, Req, undefined_state}.


% strings type^
% /ship/:node_name?answer=?
% TODO: move username to request,delete from sql response
handle(Req,State)->
    {Ses_id,Req1} = cowboy_req:cookie(<<"ssid">>,Req),
    Id=check_session(Ses_id),
    case Id of
	false ->
	    Data=[{logged_in,false},{msg,<<"not logged in">>}],
	    ReqN=Req1;
     	_ ->
	    {Path,Req2} = cowboy_req:path(Req1),
	    [Part|_]=string:tokens(binary:bin_to_list(Path),"/"),
	    case Part  of
		"status"->
		    ReqN=Req2,
		    Data=get_status();
		"ship"->
		    {Node_name,Req3} = cowboy_req:binding(node_name,Req2),
		    {Answer, ReqN}= cowboy_req:qs_val(<<"answer">>,Req3,"null"),
		    Data=get_ship(Node_name,Answer,Id);
		"problem"->
		    {Node_name,Req3} = cowboy_req:binding(node_name,Req2),
		    {Answer, ReqN}= cowboy_req:qs_val(<<"answer">>,Req3,"null"),
    		    io:fwrite(Answer),
		    Data=get_problem(Node_name,Answer,Id);
		 _ ->
		    ReqN=Req2,
		    Data=Part
	    end
    end,
    {ok, ReqM} = cowboy_req:reply(200, [{<<"content-type">>, <<"application/json">>}], jsx:encode(Data), ReqN),
    {ok, ReqM, State}.


check_session(Ses_id)->
    Squery="select id from users where session = $1",
    {ok, _ ,Id}=myquery(Squery,[Ses_id]),
    case Id of
	[{Ret}] ->
	    Ret;
	[] ->
	    false
    end. 


%check if user has acess to this section of ship
check_acess(Uid,Node_id)->
    Access_query="select id_problem from owners where id_problem = $1 and id_user = $2",
    {ok, _, Result}=myquery(Access_query,[Node_id,Uid]),
    case length(Result) of
	1 ->
	    ok;
	_ ->
	    access_denied
    end.

% main view. 
get_problem(undefined,_,Uid)->
    Node_query="select name as node_name, ans_flag as state  from problem join owners on id=id_problem where id_user = $1",
    {ok, Cols, Ret}=myquery(Node_query,[Uid]),
    Data=prepare_data({Cols, Ret});
% view by nodes
get_problem(Node_name,Answer,Uid) ->
    Node_query="select id from problem where name = $1",    
    {ok, _, Ret}=myquery(Node_query,[Node_name]),
    case length(Ret) of 
	0 -> 
            Data = [<<"Unsupported ship sector.">>];
	_->
	    [{Node_id}]=Ret,
	    case check_acess(Uid,Node_id) of 
		access_denied ->
		    Data = [<<"Ac denied!">>];
		ok ->
		    Data=prepare_data(select_data(Node_id,Answer))
	    end
    end,
    Data.

get_status()->
    Status_query="select part_name, state from ship where part_type = 'status'",
    {ok, Cols, Rows}=myquery(Status_query,[]),
    prepare_data({Cols,Rows}).

get_ship(undefined,_,Id)->
    Ship_query="select part_name, state, part_type from ship where part_type != 'status'",
    {ok, Cols, Rows}=myquery(Ship_query,[]),
    prepare_data({Cols,Rows});

get_ship(Node,Code,Id)->
    io:fwrite('NODED!\n'),
    Ship_query="update ship set state=(state+1)%2 where part_name=$1 and open_code=$2 and part_type!='status'",
    {ok, Count}=myquery(Ship_query,[Node,Code]),    
    get_ship(undefined,Code,Id).
    
select_data(Node_id,Answer)->
    Flag_query="select ans_flag from problem where problem.id = $1",
    Full_query="select name as node_name,descr,picture,answer,ans_data, ans_flag as state from problem where problem.id = $1",
    Part_query = "select name as node_name,descr,picture, ans_flag as state from problem where problem.id = $1" ,
    Check_query = "select answer from problem where problem.id = $1",
    {ok, _, [{Ans_flag}]}=myquery(Flag_query,[Node_id]),
    case Ans_flag of
	true->
	    To_execute=Full_query;
	false->
	    {ok,_,[{Ans}]} = myquery(Check_query,[Node_id]),
	    if Answer==Ans ->
		%TODO update answer flag
		{ok,_}=myquery("update problem set ans_flag = True where id = $1",[Node_id]),
	        To_execute=Full_query;
	    true ->
		To_execute=Part_query
	    end
    end,
    {ok,Cols,Ret}= myquery(To_execute,[Node_id]),
    {Cols,Ret}.

terminate(_Reason, _Req, _State)->ok.


myquery(Query,Params)->
    Host="localhost",
    Opts=[{database,"spaceship"}],
    {ok, C} = pgsql:connect(Host, ["spaceship"], ["spaceship"], Opts),
    Answer=pgsql:equery(C,Query,Params),
    ok = pgsql:close(C),
    Answer.

%TODO: to my lib

prepare_data({Cols,Data})->
    Columns=lists:map(fun({column,Name,_,_,_,_})->Name end,Cols),
    prepare_rows(Columns,Data).

prepare_rows(Cols,Data)->prepare_rows(Cols,Data,[]).
prepare_rows(_,[],Acc) -> Acc;
prepare_rows(Columns,[Row|S],Acc)->
   prepare_rows(Columns,S,[mymap(Columns,Row)|Acc]).

mymap(Lst,Tpl) when length(Lst)>=tuple_size(Tpl) ->
    lists:reverse(mymap(Lst,Tpl,[],1));
mymap(_Lst,_Tpl) ->
    throw(incompatible_len).
mymap([],_,Acc,_)->Acc;
mymap([L|St],Tpl,Acc,Cnt)->
    mymap(St,Tpl,[{L,element(Cnt,Tpl)}|Acc],Cnt+1). 
