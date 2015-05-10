/*
 * spa.chat.js
 * SPAのチャット機能モジュール
 */
/*jslint
 browser : true,  continue : true, devel    : true, indent : 2,    maxerr : 50,
 newcap  : true,  nomen    : true, plusplus : true, regexp : true, sloppy : true,
 vars    : false, white    : true
*/
/*global $, spa:true */
spa.chat = (function() {
  //----モジュールスコープ変数開始------
  var
    configMap = {
      main_html : String()
        + '<div style="padding:1em; color:#fff;">'
        + 'こんにちは'
        + '</div>',
      settable_map : {}
    },
    stateMap = { $container : null },
    jqueryMap = {},

    setJqueryMap, configModule, initModule;
  //----モジュールスコープ変数終了------

  //-----ユーティリティメソッド開始-----
  //-----ユーティリティメソッド終了-----

  //-----DOMメソッド開始--------------
  setJqueryMap = function() {
  	var $container = stateMap.$container;
  	jqueryMap = { $container : $container };
  };
  //-----DOMメソッド終了--------------

  //-----イベントハンドラ開始----------
  //-----イベントハンドラ終了----------

  //------パブリックメソッド開始-------
  // configModule/start
  // 目的：許可されたキーの構成を更新する
  // 引数：構成可能なキーバリューマップ
  //   * color_name - 使用する色
  // 設定：
  //   * configMap.settable_map 許可されたキーを宣言する
  // 戻り値：true
  // 例外発行：なし
  configModule = function( input_map ) {
  	spa.util.setConfigMap({
  	  input_map : input_map,
  	  settable_map : configMap.settable_map,
  	  config_map : configMap
  	});
  	return true;
  };
  // configModule/end

  // initModule/start
  // 目的：モジュール初期化
  // 引数：
  //   * $container この機能が使うjQuery要素
  // 戻り値：true
  // 例外発行：なし
  initModule = function( $container ) {
  	$container.html( configMap.main_html );
  	stateMap.$container = $container;
  	setJqueryMap();
  	return true;
  };
  // initModule/end

  return {
  	configModule : configModule,
  	initModule : initModule
  };
  //------パブリックメソッド終了-------		
}());