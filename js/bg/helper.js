import {getBaseStruct} from '../config/data-struct';
import StoreUtil from '../utils/StoreUtil';
import colDataStore from '../store/ColData';
import ArrayUtil from '../utils/ArrayUtil';
import Constant from '../config/Constant';
import PageUtil from '../utils/PageUtil';
import $ from 'jquery-ajax';

let cGetUrl = chrome.runtime.getURL;
const {STOR_KEY_IS_CLOSE_TIPS,STOR_KEY_COLS,TYPE_ISSUE} = Constant;

function createNotify(title, iconUrl, message, newUrl) {
    let options = {
        type: chrome.notifications.TemplateType.BASIC,
        title: title,
        iconUrl: iconUrl,
        isClickable: true,
        message: message,
        buttons: [
            {title: '打开', iconUrl: cGetUrl('images/notification-buttons/ic_flash_auto_black_48dp.png')},
            {title: '已读', iconUrl: cGetUrl('images/notification-buttons/ic_exposure_plus_1_black_48dp.png')}],
    };
    chrome.notifications.create(newUrl, options);
}

/**
 * 查询是否有更新的通用函数
 */
export async function queryUpdateOfBg(site,type,callback){
    const {baseUrl,siteName,icon} = getBaseStruct(site,type);
    let {cols,allCols} = await getCol(site,type);
    return new Promise((resolve)=>{
        let createSucCall = function (col) {
            return async function (data) {
                try {
                    let resObj = callback(data);
                    let {answerNum,isAccept} = resObj;
                    answerNum = parseInt(answerNum,10);
                    isAccept = !!isAccept;
                    //不能使用全等，对于没有设置isAccept会有问题
                    if (col.isAccept != isAccept || col.answerNum !== answerNum) {
                        let isCloseTips = await StoreUtil.load(STOR_KEY_IS_CLOSE_TIPS);
                        if (!isCloseTips) {
                            //生成提示
                            if (type !== TYPE_ISSUE || col.isAccept == isAccept) createNotify(siteName + ' 【更新】', icon, col.title, PageUtil.formatHref(col.url, baseUrl));
                            else {
                                createNotify(siteName + ' 【采纳】', icon, col.title, PageUtil.formatHref(col.url, baseUrl));
                            }
                        }

                        col.answerNum = answerNum;
                        col.isAccept = isAccept;

                        if (!col.isUpdate) {
                            col.isUpdate = true;
                        }
                        colDataStore.setAllCols(allCols);
                    }
                } catch (e) {
                    console.log(e);
                } finally {
                    resolve();
                }
            };
        };
        let query = (col,callback) => {
            try{
                let data,url = PageUtil.formatHref(col.url, baseUrl),type = 'GET';
                if(col.queryInfo){
                    data = col.queryInfo.param;
                    url = col.queryInfo.url;
                    type = col.queryInfo.type;
                }
                $.ajax(url, {
                    success: callback,
                    error:err => {
                        console.log(siteName+' ajax err',err);
                        resolve();
                    },
                    data,
                    type
                });
            }catch(e){
                console.warn('ajax error',e);
                resolve();
            }
        };
        for (let i = 0, len = cols.length; i < len; i++) {
            let col = cols[i];
            let url = col.url;
            query(col,createSucCall(col));
        }
        if(cols.length === 0) resolve();
    });
}
/**
 * 设置徽章
 */
export function setBadge(num, color = 'red') {
    if (num <= 0) {
        chrome.browserAction.setBadgeText({
            text: ''
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: color
        });
        return;
    }
    chrome.browserAction.setBadgeText({
        text: '' + num
    });
    chrome.browserAction.setBadgeBackgroundColor({
        color: color
    })
}

/**
 * 获取某站点下所有的采集，以及更新的数目
 */
async function getCol(site, type) {
    let defaultStore = getBaseStruct(site, type);
    let allCols = await StoreUtil.load(STOR_KEY_COLS);
    allCols = allCols ? allCols : [];
    let index = -1;
    if (allCols.length) index = ArrayUtil.getIndexEqStr(allCols, {site, type});
    let cols = [];
    if (index < 0) {
        defaultStore.cols = cols;
        allCols.unshift(defaultStore);
    } else {
        cols = allCols[index].cols;
    }
    return {cols,allCols};
}
