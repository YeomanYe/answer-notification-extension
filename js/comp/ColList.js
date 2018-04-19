import React, { Component } from 'react';

export default class ColList extends Component {
    createDelCol(colItem){
        let {type,site,title} =colItem;
        let self = this;
        return ()=>{
            getCols(site,type,(cols,allCols)=>{
                let index = arrEqStr(cols,{title:title});
                let col;
                if(index < 0) return;
                col = cols.splice(index,1);
                storLocal.set({[STOR_KEY_COLS]:allCols});
                decUpdateNum(col);
                //从视图中删除
                let {datas} = self.state;
                index = datas.indexOf(colItem);
                datas.splice(index,1);
                self.setState({datas});
                sendToAllTabs([CNT_CMD_UPDATE_CUR_FAV]);
            });
        }
    }
    renderItem(datas){
        let retArr = [];
        log('list datas',datas);
        datas.map((data)=>{
            retArr.push(
                <li>
                    <a href={data.origin} target="_blank" className="left">
                        <div style={data.iconStyle}></div>
                    </a>
                    <div className="middle">
                    <a href={data.url} target="_blank">
                        <h3>{data.siteName}<span style={{display:data.isUpdate ? 'inline-block' : 'none'}} className="badge">更新</span></h3>
                        <p>{data.title}</p>
                    </a>
                    </div>
                    <div className="right">
                        <p>是否解决:{data.isAccept ? '是' : '否'}</p>
                        <p>回答数量:{data.answerNum}</p>
                        <p><span onClick={this.createDelCol(data)} className="del-col">删除</span></p>
                    </div>
                </li>
            );
        });
        return retArr;
    }
    componentDidMount(){
        let self = this;
        getStoreLocal(STOR_KEY_COLS,(allCols)=>{
            let datas = [];
            allCols = allCols ? allCols : [];
            log('allCols',allCols);
            allCols.map((item)=>{
                let {icon,origin,siteName,baseUrl,site,type} = item;
                let iconStyle = {backgroundImage:`url('${icon}')`};
                item.cols.map((col)=>{
                    let {title,url,isAccept,answerNum,isUpdate} = col;
                    datas.push({
                        type,site,title,isAccept,answerNum,isUpdate,origin,iconStyle,siteName,
                        url:formatHref(url,baseUrl)
                    })
                });
            });
            self.setState({datas})
        });
    }
    constructor(props){
        super(props);
        this.state = {
            datas:[]
        };
    }
    render() {
        let {datas} = this.state;
        return (
          <div id='col-list-wrap'>
              <ul id={"colList"}>
                  {this.renderItem(datas)}
              </ul>
          </div>
        );
    }
}