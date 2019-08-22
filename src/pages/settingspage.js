const { ipcRenderer } = require("electron");
const $ = require("jquery");
let settings;
ipcRenderer.on("settings",(evt,sett)=>{
    settings = sett.settings;
    if(sett.inputs){
        for(let ktag in sett.inputs){
            let configtag = sett.inputs[ktag];
            $(".tabsHeaders").append(
                $(`<li>`)
                .attr({
                    rel:ktag
                })
                .click(function(){
                    let id = $(this).attr("rel");
                    $(this).parent().find("li.active").remove("active");
                    $(this).addClass("active");
                    $(this).parent().parent().find(`.tab`).css({display:"none"});
                    $(this).parent().parent().find(`#${id}.tab`).css({display:"flex"});
                })
                .text(ktag)
            );
            let divTag = $("<div>")
            divTag.addClass("tab");
            divTag.attr("id",ktag);
            for(let k in configtag){
                let config = configtag[k];
                switch(config.type){
                    case "checkbox":
                        divTag.append(
                            $("<div>")
                                .addClass("row")
                                .append(
                                    $("<label>")
                                        .addClass("label-form")
                                        .append(config.text)
                                        .append("<br>")
                                        .append(
                                            $("<span>")
                                                .addClass("tiny")
                                                .append(config.tinyText)
                                        )
                                )
                                .append(
                                    $("<input>")
                                        .addClass("input-form")
                                        .attr({
                                            name:k,
                                            type:"checkbox"
                                        })
                                        .prop("checked", config.value)
                                )
                        )
                    break;
                }
            }
            $(".tabsContainer").append(divTag);
        }
        $(".tabsHeaders li:first").click();
    }
    if(settings){
        $.each(settings,(tabname,tab)=>{
            $.each(tab,(name,val)=>{
                let el = $(`#${tabname} [name="${name}"]`);
                if(el.attr("type") == "checkbox"){
                    el.prop("checked",val);
                }else{
                    el.val(val);
                }
            })
        })
    }
    $("input[requireReboot],select[requireReboot]").each(function(){
        let val = ($(this).attr("type")=="checkbox"?$(this).is(":checked"):$(this).val());
        $(this).data("ori-value",val);  
    })
})
$(document).ready(() => {
    $("input[requireReboot],select[requireReboot]").change(function(){
        let val = ($(this).attr("type")=="checkbox"?$(this).is(":checked"):$(this).val());
        if($(this).data("ori-value") != val){
            alert("Some configurations require to reboot the app");
        }
    });
    $("#Accept").on("click",()=>{
        let data = {};
        let requireReboot = false;
        $(".tab").each(function(){
            let tabname = $(this).attr("id");
            if(!data[tabname])data[tabname] = {};
            $("input,select",this).each((i,e)=>{
                data[tabname][$(e).attr("name")] = ($(e).attr("type")=="checkbox"?$(e).is(":checked"):$(e).val());
            })
        })
        if(requireReboot){
            
        }
        save(data);
    })
    $("#Cancel").on("click",()=>{
        save(null);
    });
    ipcRenderer.send("getData", true);
})

function save(data){
    console.log(data);
    ipcRenderer.send("send", data);
}