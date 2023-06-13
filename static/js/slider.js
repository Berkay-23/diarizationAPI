class Slider {
    constructor(rangeElement, valueElement, options) {
        this.rangeElement = rangeElement
        this.valueElement = valueElement || null
        this.options = options

        this.rangeElement.on('input', this.updateVolume.bind(this))
    }

    // Initialize the slider
    init() {
        this.rangeElement.attr('min', this.options.min)
        this.rangeElement.attr('max', this.options.max)
        this.rangeElement.val(this.options.cur)
        this.updateVolume()
    }

    generateBackground(value) {
        if (value === this.options.min) return

        let percentage = (this.rangeElement.val() - this.options.min) / (this.options.max - this.options.min) * 100
        return `linear-gradient(to right, #ff1a1a, #8d1a8c ${percentage}%, #d3edff ${percentage}%, #dee1e2 100%)`
    }

    updateVolume(value) {
        if (this.valueElement) this.valueElement.text(`${this.rangeElement.val()}%`)
        this.rangeElement.css({'background': this.generateBackground(this.rangeElement.val())})
        $('#audio').prop('volume', this.rangeElement.val() / 100)
    }

    getValue(){
        return this.rangeElement.val();
    }

    setValue(value){
        this.rangeElement.val(value);
        this.updateVolume();
    }
}