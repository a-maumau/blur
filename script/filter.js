var M_PI = 3.14159265359;

function createWeightGaussian(sigm, size) {
    var sig = 2*sigm*sigm;
    var div = Math.sqrt(sig*M_PI);
    var hsize = parseInt(size/2);
    var weight = [];
    var tmp;
    var sum=0;

    for(var x=0; x < size; x++){
        tmp = (x-hsize)*(x-hsize);
        weight[x] = Math.exp(-tmp/sig)/div;
        sum += weight[x]
    }

    for(var x=0; x < size; x++){
        weight[x] = weight[x]/sum;
    }

    return weight;
}

function fastGaussianFilter(weight, src, dst, size, width, height){
    var tmp_val_0;
    var tmp_val_1;
    var tmp_val_2;
    var temp = [];
    var fh = parseInt(size/2);
    var pix;
    var index;
    var image_len = height*width*4;

    for(var h=0; h < height; h++){
        for(var w=0; w < width; w++){
            tmp_val_0 = 0;
            tmp_val_1 = 0;
            tmp_val_2 = 0;
            pix = (w + h*width)*4;

            // y way
            for(var k=0, y=-fh; k<size; k++, y++){
                index = pix+y*width*4;
                if(index >= image_len || index < 0){
                    tmp_val_0 += weight[k]*src[pix];
                    tmp_val_1 += weight[k]*src[pix+1];
                    tmp_val_2 += weight[k]*src[pix+2];
                }else{
                    tmp_val_0 += weight[k]*src[index];
                    tmp_val_1 += weight[k]*src[index+1];
                    tmp_val_2 += weight[k]*src[index+2];
                }
            }
            temp[pix] = tmp_val_0;
            temp[pix+1] = tmp_val_1;
            temp[pix+2] = tmp_val_2;
            dst[pix+3] = src[pix+3];
        }
    }
            
    for(var h=0; h < height; h++){
        for(var w=0; w < width; w++){
            tmp_val_0 = 0;
            tmp_val_1 = 0;
            tmp_val_2 = 0;
            pix = (w + h*width)*4;

            // x way
            for(var k=0, x=-fh; k<size; k++, x++){
                index = pix+x*4;
                if(w+x >= width || w+x < 0){
                    tmp_val_0 += weight[k]*temp[pix];
                    tmp_val_1 += weight[k]*temp[pix+1];
                    tmp_val_2 += weight[k]*temp[pix+2];
                }else{
                    tmp_val_0 += weight[k]*temp[index];
                    tmp_val_1 += weight[k]*temp[index+1];
                    tmp_val_2 += weight[k]*temp[index+2];
                }
            }
            dst[pix] = tmp_val_0;
            dst[pix+1] = tmp_val_1;
            dst[pix+2] = tmp_val_2;
        }
    }
}

function createWeightSAM(size) {
    var weight = [];

    for(var x=0; x < size; x++){
        weight[x] = 1/size;
    }

    return weight;
}

function SAMFilter(filter, src, dst, filter_size, num, width, height){
    var temp_0;
    var temp_1;
    var temp_2;
    var tmp_val_0;
    var tmp_val_1;
    var tmp_val_2;
    var tmp = [];
    var fh = parseInt(filter_size/2);
    var pix;
    var pos;
    var index;
    var _index;
    var image_len = height*width*4;

    for(var n=0; n < num; n++){
        if(n == 0){
            console.log(n)
            for(var h=0; h < height; h++){
                for(var w=0; w < width; w++){
                    temp_0 = [];
                    temp_1 = [];
                    temp_2 = [];
                    tmp_val_0 = 0;
                    tmp_val_1 = 0;
                    tmp_val_2 = 0;
                    pix = (w + h*width)*4;
                    // W^t * pixels -> X
                    for(var k=0, x=-fh; k<filter_size; k++, x++){
                        index = pix+x*4;
                        for(var l=0, y=-fh; l<filter_size; l++, y++){
                            _index = index+y*width*4;
                            if(_index >= image_len || _index < 0){
                                tmp_val_0 += filter[l]*src[pix];
                                tmp_val_1 += filter[l]*src[pix+1];
                                tmp_val_2 += filter[l]*src[pix+2];
                            }else if(w+x >= width || w+x < 0){
                                tmp_val_0 += filter[l]*src[pix];
                                tmp_val_1 += filter[l]*src[pix+1];
                                tmp_val_2 += filter[l]*src[pix+2];
                            }else{
                                tmp_val_0 += filter[l]*src[index];
                                tmp_val_1 += filter[l]*src[index+1];
                                tmp_val_2 += filter[l]*src[index+2];
                            }
                        }
                        temp_0.push(tmp_val_0);
                        temp_1.push(tmp_val_1);
                        temp_2.push(tmp_val_2);
                    }
                    
                    tmp_val_0 = 0;
                    tmp_val_1 = 0;
                    tmp_val_2 = 0;
                    
                    // X*W -> filtered value
                    for(var cal=0; cal<filter_size; cal++){
                        tmp_val_0 += temp_0[cal]*filter[cal];
                        tmp_val_1 += temp_1[cal]*filter[cal];
                        tmp_val_2 += temp_2[cal]*filter[cal];
                    }
                    tmp[pix] = dst[pix] = tmp_val_0;
                    tmp[pix+1] = dst[pix+1] = tmp_val_1;
                    tmp[pix+2] = dst[pix+2] = tmp_val_2;
                    tmp[pix+3] = dst[pix+3] = src[pix+3];
                }
            }
        }else{
            for(var h=0; h < height; h++){
                for(var w=0; w < width; w++){
                    temp_0 = [];
                    temp_1 = [];
                    temp_2 = [];
                    tmp_val_0 = 0;
                    tmp_val_1 = 0;
                    tmp_val_2 = 0;
                    pix = (w + h*width)*4;
                    // W^t * pixels -> X
                    for(var k=0, x=-fh; k<filter_size; k++, x++){
                        index = pix+x*4;
                        for(var l=0, y=-fh; l<filter_size; l++, y++){
                            _index = index+y*width*4;
                            if(_index >= image_len || _index < 0){
                                tmp_val_0 += filter[l]*tmp[pix];
                                tmp_val_1 += filter[l]*tmp[pix+1];
                                tmp_val_2 += filter[l]*tmp[pix+2];
                            }else if(w+x >= width || w+x < 0){
                                tmp_val_0 += filter[l]*tmp[pix];
                                tmp_val_1 += filter[l]*tmp[pix+1];
                                tmp_val_2 += filter[l]*tmp[pix+2];
                            }else{
                                tmp_val_0 += filter[l]*tmp[index];
                                tmp_val_1 += filter[l]*tmp[index+1];
                                tmp_val_2 += filter[l]*tmp[index+2];
                            }
                        }
                        temp_0.push(tmp_val_0);
                        temp_1.push(tmp_val_1);
                        temp_2.push(tmp_val_2);
                    }
                    
                    tmp_val_0 = 0;
                    tmp_val_1 = 0;
                    tmp_val_2 = 0;
                    
                    // X*W -> filtered value
                    for(var cal=0; cal<filter_size; cal++){
                        tmp_val_0 += temp_0[cal]*filter[cal];
                        tmp_val_1 += temp_1[cal]*filter[cal];
                        tmp_val_2 += temp_2[cal]*filter[cal];
                    }
                    tmp[pix] = dst[pix] = tmp_val_0;
                    tmp[pix+1] = dst[pix+1] = tmp_val_1;
                    tmp[pix+2] = dst[pix+2] = tmp_val_2;
                }
            }
        }
    }
}