-module(webserver_app).
 
-behaviour(application).

%% Application callbacks
-export([start/2, stop/1, update_routes/0]).

%% ===================================================================
%% Application callbacks
%% ===================================================================

dispatch_rules()->
    cowboy_router:compile([
			   {'_', [
				  {"/", index_handler, []},
				  {"/persongraph",persongraph_handler,[] },
				  {"/cutting",cutting_handler,[] },  				 

				  {"/spaceship", cowboy_static, {file, "/home/iero/src/topor.lipetsk.ru/priv/html/spaceship.html"}},
				  {"/js/[...]", cowboy_static, {dir, "/home/iero/src/topor.lipetsk.ru/priv/js"}},
				  {"/css/[...]", cowboy_static, {dir, "/home/iero/src/topor.lipetsk.ru/priv/css"}},
				  {"/img/[...]", cowboy_static, {dir, "/home/iero/src/topor.lipetsk.ru/priv/img"}},
				  {"/space", cowboy_static, {file, "/home/iero/src/topor.lipetsk.ru/priv/html/spaceship.html"}},
				  {"/building", cowboy_static, {file, "/home/iero/src/topor.lipetsk.ru/priv/html/building.html"}},
                                  {"/exp", cowboy_static, {file, "/home/iero/src/topor.lipetsk.ru/priv/html/expences.html"}},
                                  {"/exp[/:action]", expence_handler,[]}, 

				  {"/statistics", statistics_handler,[]},
				  {"/getremote",getremote_handler, []},
				  {"/login",auth_handler,[] },
                                  {"/status",quest_handler,[] },
				  {"/ship[/:node_name]",quest_handler,[] },
                                  {"/problem[/:node_name]",quest_handler,[] },
				  {"/logout",logout_handler,[] },
				  {'_', notfound_handler, []}
				 ]}
			  ]).

start(_Type, _Args) ->
    Dispatch =dispatch_rules(),
    Port = 8080,
    {ok, _} = cowboy:start_http(http_listener, 100,[{port, Port}],[{env, [{dispatch, Dispatch}]}]),
    webserver_sup:start_link().

stop(_State) ->
    ok.


update_routes() ->
    cowboy:set_env(http_listener, dispatch,dispatch_rules()).
 
