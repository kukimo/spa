/* 
 * spa.shell.js
 * SPAのシェルモジュール
 */
/*jslint
 browser : true,  continue : true, devel    : true, indent : 2,    maxerr : 50,
 newcap  : true,  nomen    : true, plusplus : true, regexp : true, sloppy : true,
 vars    : false, white    : true
*/
/*global $, spa */
spa.shell = (function() {
	'use strict';

	//----モジュールスコープ変数開始------
	var
	  configMap = {
	  	anchor_schema_map : {
	  	  chat : { opened : true, closed : true }
	  	},

	  	resize_interval : 200,

	  	main_html : String()
	  	  + '<div class="spa-shell-head">'
            + '<div class="spa-shell-head-logo">'
              + '<h1>SPA</h1>'
              + '<p>javascript end to end</p>'
              + '</div>'
            + '<div class="spa-shell-head-acct"></div>'
            + '<div class="spa-shell-head-search"></div>'
          + '</div>'
          + '<div class="spa-shell-main">'
            + '<div class="spa-shell-main-nav"></div>'
            + '<div class="spa-shell-main-content"></div>'
          + '</div>'
          + '<div class="spa-shell-foot"></div>'
          + '<div class="spa-shell-modal"></div>',
	  },
	  stateMap = { 
	  	$container        : undefined,
	  	anchor_map        : {},
	  	resize_idto       : undefined
	  },
	  jqueryMap = {},

	  copyAnchorMap, setJqueryMap, changeAnchorPart, 
	  onResize, onTapAcct, onLogin, onLogout,
	  onHashchange, setChatAnchor, initModule;
	//----モジュールスコープ変数終了------

	//-----ユーティリティメソッド開始-----
	// 格納したアンカーマップのコピーを返す。オーバーヘッドを最小限にする。
	copyAnchorMap = function() {
	  return $.extend( true, {}, stateMap.anchor_map );
	};
	//-----ユーティリティメソッド終了-----

	//-----DOMメソッド開始--------------
	// DOMメソッド/changeAnchorPart/Start
	// 目的: UIRアンカー要素部分を変更する
	// 引数:
	//   * arg_map - 変更したいURIアンカー部分を表すマップ
	// 戻り値:boolean
	//   * true - URIのアンカー部分が更新された
	//   * false- URIのアンカー部分を更新できなかった
	// 動作：
	//   現在のアンカーをstateMap.anchor_mapに格納する
	//   エンコーディングの説明はuriAnchor参照
	//   このメソッドは
	//   * copyAnchorMapを使って子のマップのコピーを作成する
	//   * arg_mapを使ってキーバリューを修正する
	//   * エンコーディングの独立値と従属値の区別を管理する
	//   * uriAnchorを使ってURIの変更を試みる
	//   * 成功時にはtrue,　失敗時にはfalseを返す
	changeAnchorPart = function( arg_map ) {
	  var
	    anchor_map_revise = copyAnchorMap(),
	    bool_return = true,
	    key_name, key_name_dep;

	  //アンカーマップへ変更を統合開始
	  KEYVAL:
	  for( key_name in arg_map ) {
	  	if( arg_map.hasOwnProperty( key_name) ) {
	  	  //従属キーを飛ばす
	  	  if( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }
	  	  //独立キー値を更新する
	  	  anchor_map_revise[key_name] = arg_map[key_name];
	  	  //合致する独立キーを更新する
	  	  key_name_dep = '_' + key_name;
	  	  if( arg_map[key_name_dep] ) {
	  	  	anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
	  	  } else {
	  	  	delete anchor_map_revise[key_name_dep];
	  	  	delete anchor_map_revise['_s' + key_name_dep];
	  	  }
	  	}
	  }
	  //アンカーマップへの統合終了

	  //URI更新開始。失敗したら元に戻す
	  try {
	  	$.uriAnchor.setAnchor( anchor_map_revise );
	  } catch( error ) {
	  	$.uriAnchor.setAnchor( stateMap.anchor_map, null, true );
	  	bool_return = false;
	  }
	  //URI更新終了

	  return bool_return;
	};
	// DOMメソッド/changeAnchorPart/End

	// DOMメソッド/setJqueryMap/開始
	setJqueryMap = function() {
		var $container = stateMap.$container;
		jqueryMap = { 
			$container : $container,
			$acct : $container.find('.spa-shell-head-acct'),
			$nav : $container.find('.spa-shell-main-nav')
		};
	};
	// DOMメソッド/setJqueryMap/終了

	//-----DOMメソッド終了--------------

	//-----イベントハンドラ開始----------
	//イベントハンドラ/onHashchange/start
	// 目的：hashchangeイベントを処理する
	// 引数：
	//   * event-jQueryイベントオブジェクト
	// 設定：なし
	// 戻り値：false
	// 動作：
	//   * URIアンカー要素を解析する
	//   * 提示されたアプリケーション状態と現在の状態を比較する
	//   * 提示された状態が現在の状態と異なり、アンカースキーマで
	//     許可されている場合はアプリケーションを調整する
	onHashchange = function( event ) {
	  var
	    is_ok = true,
	    anchor_map_previous = copyAnchorMap(),
	    anchor_map_proposed,
	    _s_chat_previous, _s_chat_proposed,
	    s_chat_proposed;

	  //アンカーの解析
	  try { 
	  	anchor_map_proposed = $.uriAnchor.makeAnchorMap();
	  } catch( error ) {
	  	$.uriAnchor.setAnchor( anchor_map_previous, null, true);
	  	return false;
	  }
	  stateMap.anchor_map = anchor_map_proposed;

	  _s_chat_previous = anchor_map_previous._s_chat;
	  _s_chat_proposed = anchor_map_proposed._s_chat;

	  //アンカーに変更があればチャットコンポーネント更新
	  if( !anchor_map_previous || _s_chat_previous !== _s_chat_proposed ) {
	  	s_chat_proposed = anchor_map_proposed.chat;
	  	switch( s_chat_proposed ) {
	  	  case 'opened':
	  	    is_ok = spa.chat.setSliderPosition('opened');
	  	    break;
	  	  case 'closed':
	  	    is_ok = spa.chat.setSliderPosition('closed');
	  	    break;
	  	  default:
	  	    spa.chat.setSliderPosition('closed');
	  	    delete anchor_map_proposed.chat;
	  	    $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
	  	}
	  }
	  //チャットコンポーネント更新終了

	  //スライダー変更できなかったときにアンカーを元に戻す start
	  if (!is_ok) {
	  	if(anchor_map_previous) {
	  	  $.uriAnchor.setAnchor( anchor_map_previous, null, true );
	  	  stateMap.anchor_map = anchor_map_previous;
	  	} else {
	  	  delete anchor_map_proposed.chat;
	  	  $.uriAnchor.setAnchor( anchor_map_proposed, null, true);
	  	}
	  }
	  //スライダー変更できなかったときにアンカーを元に戻す end

	  return false;
	};

	onTapAcct = function( event ) {
	  var acct_text, user_name, user = spa.model.people.get_user();
	  if( user.get_is_anon() ) {
	  	user_name = prompt( 'Please sign-in' );
	  	spa.model.people.login( user_name );
	  	jqueryMap.$acct.text( '...processing...' );
	  } else {
	  	spa.model.people.logout();
	  }
	  return false;
	};

	onLogin = function( event, login_user ) {
	  jqueryMap.$acct.text( login_user.name );
	};

	onLogout = function( event, logout_user ) {
	  jqueryMap.$acct.text( 'Please sign-in' );
	};
	//イベントハンドラ/onHashchange/end

	// onResize/start
	onResize = function() {
	  if( stateMap.resize_idto ) { return true; }

	  spa.chat.handleResize();
	  stateMap.resize_idto = setTimeout(
	  	function() { stateMap.resize_idto = undefined; },
	  	configMap.resize_interval
	  );
	};
	// onResize/end

	//-----イベントハンドラ終了----------

	//------コールバックメソッド開始-----
	// コールバックメソッド/setChatAnchor/start
	// 用例：setChatAnchor( 'closed' )
	// 目的：アンカーのチャットコンポーネントを変更する
	// 引数：
	//   * position_type - 「closed」または「opened」
	// 動作：
	//   * 可能ならURIアンカーパラメータ「chat」を要求値に変更する
	// 戻り値：
	//   * true - 要求されたアンカー部分が更新された
	//   * false- 要求されたアンカー部分が更新されなかった
	// 例外発行： なし
	setChatAnchor = function( position_type ) {
	  return changeAnchorPart({ chat : position_type });
	};
	// コールバックメソッド/setChatanchor/end
	//------コールバックメソッド終了-----

	//------パブリックメソッド開始-------
	// public/initModule/start
	// 用例：spa.shell.initModule( $('#app_div_id'));
	// 目的：チャットモジュールを初期化する
	// 引数：
	//   * $append_target(例：$('#app_div_id'))
	//     一つDOMコンテナを表すjQueryコレクション
	// 動作：
	//   $containerにUIシェルを含め、機能モジュールを構成して初期化する。
	//   シェルはURIアンカーやCookieの管理などのブラウザ全体を管理する
	// 戻り値：なし
	// 例外発行：なし
	initModule = function( $container ) {
		//HTMLをロードし、jQueryコレクションをマッピングする
		stateMap.$container = $container;
		$container.html( configMap.main_html );
		setJqueryMap();

		//uriAnchorを設定
		$.uriAnchor.configModule({
		  schema_map : configMap.anchor_schema_map
		});

		// 機能モジュールを構成して初期化する
		spa.chat.configModule( {
		  set_chat_anchor : setChatAnchor,
		  chat_model : spa.model.chat,
		  people_model : spa.model.people
		} );
		spa.chat.initModule( jqueryMap.$container );

		$.gevent.subscribe( $container, 'spa-login', onLogin );
		$.gevent.subscribe( $container, 'spa-logout', onLogout );
		jqueryMap.$acct.text( 'Please sign-in' ).bind( 'utap', onTapAcct );

		//URIアンカー変更イベントを処理する
		//これは全ての機能モジュールを設定して初期化した後に行う。
		//そうしないとトリガーイベントを処理できる状態になっていない。
		//トリガーイベントはアンカーがロード状態と見なせることを保証するために使う
		$(window)
		  .bind( 'resize', onResize )
		  .bind( 'hashchange', onHashchange )
		  .trigger( 'hashchange' );
	};
	// public/initModule/end
	return { initModule : initModule };
	//------パブリックメソッド終了-------		
}());