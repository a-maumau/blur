/* Modal */
window.onload = function(e){
    var original_img=null;
    var filtered_img=null;
    var print_img_id = 'print_img';
    var print_DataURL_id = 'print_DataURL';
    var canvas = document.getElementById('image_canvas');

    var SM = new SimpleModal({"btn_ok":"Export", "hideFooter":false, "width":250, "closeButton":false, "onAppend":function(){$("simple-modal").fade("in")}});
    SM.addButton("Export", "btn primary", function(){
        if(filtered_img != null){
            //a = document.createElement('a');
            a = document.getElementById("download_link");
            a.download = "export.png"
            a.href = canvas.toDataURL("image/png");
            e = document.createEvent('MouseEvent');
            e.initEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
        }
    });
    SM.show({
        "model":"modal",
        "title":"Parameter",
        "contents":'<div class="foreground"><div id="navigation" class="navigation"><div><input type="file" id="selectfile" accept="image/*"><table><tbody><tr><td class="select_title">Filter Type</td><td class="select_box"><select id="filter_type" title=""><option value="0">Gaussian</option><option value="1">SAM</option><option value="2">not yet</option><tr><td class="range_title">強さ</td><td class="range_slider"><input id="slider_0" type="range" min="0" max="1000" value="0"title=""></td></tr><tr><td class="range_title">範囲</td><td class="range_slider"><input id="slider_1" type="range" min="0" max="49" value="0"title=""></td></tr></tbody></table></div></div><div>'
    });

    var sliders = [];
    var slider;
    for (var i = 0; i < 2; ++i) {
        slider = document.getElementById("slider_" + i);
        slider.addEventListener("change", onChangeValue);
        sliders.push(slider)
    }

    var filter_type = document.getElementById("filter_type");
    filter_type.addEventListener("change", onChangeFilter);

    if ( checkFileApi() && checkCanvas(canvas) ){
        //ファイル選択
        var file_image = document.getElementById('selectfile');
        file_image.addEventListener('change', selectReadfile, false);
        //ドラッグオンドロップ
        //var dropZone = document.getElementById('drop-zone');
        document.addEventListener('dragover', handleDragOver, false);
        document.addEventListener('drop', handleDragDropFile, false);
        //document.addEventListener("dragenter", cancelEvent, false);
    }
    //canvas に対応しているか
    function checkCanvas(canvas){
        if (!canvas || !canvas.getContext){
            return false;
        }
        return true;
    }
    // FileAPIに対応しているか
    function checkFileApi() {
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
            return true;
        }
        alert('The File APIs are not fully supported in this browser.');
        return false;
    }
    //ファイルが選択されたら読み込む
    function selectReadfile(e) {
        var file = e.target.files;
        var reader = new FileReader();
        //dataURL形式でファイルを読み込む
        reader.readAsDataURL(file[0]);
        //ファイルの読込が終了した時の処理
        reader.onload = function(){
            readDrawImg(reader, canvas, 0, 0);
        }
    }
    //ドラッグオンドロップ
    function handleDragOver(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }
    function handleDragDropFile(e) {
        e.stopPropagation();
        e.preventDefault();
        var files = e.dataTransfer.files; // FileList object.
        var file = files[0];
        var reader = new FileReader();
        //dataURL形式でファイルを読み込む
        reader.readAsDataURL(file);
        //ファイルの読込が終了した時の処理
        reader.onload = function(){
            readDrawImg(reader, canvas, 0, 0);
        }
    }
    function readDrawImg(reader, canvas, x, y){
        var img = readImg(reader);
        filtered_img = canvas.getContext('2d');
        drawImgOnCav(canvas, img, x, y);
    }
    //ファイルの読込が終了した時の処理
    function readImg(reader){
        //ファイル読み取り後の処理
        var result_dataURL = reader.result;
        var img = new Image();
        img.src = result_dataURL;
        return img;
    }
    //キャンバスにImageを表示
    function drawImgOnCav(canvas, img, x, y) {
        img.onload = function(){
            var ctx = canvas.getContext('2d');
            //var wrapper= document.getElementById("print_img");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, x, y, img.width, img.height);
            for (var i = 0; i < 2; ++i) {
                sliders[i].value = 0;
            }
            original_img = ctx.getImageData(0, 0, img.width, img.height);
            filtered_img = ctx.createImageData(img.width, img.height);
        }
    }

    function updateCav(canvas, update_img, x, y) {
        var ctx = canvas.getContext('2d');
        ctx.putImageData(update_img, x, y);
    }

    function onChangeValue(event) {
        if(filtered_img != null){
            var src = original_img.data;
            var dst = filtered_img.data;
            if(sliders[0].value == 0){
                updateCav(canvas, original_img, 0, 0);
            }else{
                //var weight = createWeightGaussian(2.5, 31);
                if(filter_type.value == 0){
                    var weight = createWeightGaussian(sliders[0].value/100.0, 2*sliders[1].value+1);
                    fastGaussianFilter(weight, src, dst, 2*sliders[1].value+1, canvas.width, canvas.height);
                }else if(filter_type.value == 1){
                    var weight = createWeightSAM(2*sliders[1].value+1);
                    SAMFilter(weight, src, dst, 2*sliders[1].value+1, sliders[0].value, canvas.width, canvas.height);
                }
                //process(weight, src, dst, 3, canvas.width, canvas.height)
                //sobelFilter(src, dst, canvas.width, canvas.height)
                //fastGaussianFilter(weight, src, dst, 31, canvas.width, canvas.height);
                updateCav(canvas, filtered_img, 0, 0);
            }
        }
    }

    function onChangeFilter(event) {
        if(filter_type.value == 0){
            sliders[0].value = 0;
            sliders[0].min = 0;
            sliders[0].max = 1000;
            sliders[1].value = 0;
            sliders[1].min = 0;
            sliders[1].max = 49;
        }else if(filter_type.value == 1){
            sliders[0].value = 0;
            sliders[0].min = 0;
            sliders[0].max = 10;
            sliders[1].value = 0;
            sliders[1].min = 0;
            sliders[1].max = 20;
        }
        updateCav(canvas, original_img, 0, 0);
    }
};